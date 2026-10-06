import { WebSocket, WebSocketServer, type RawData } from 'ws';
import { createMessageQueue } from './messageQueue.js';
import jwt from "jsonwebtoken";
import { JWT_SECRET } from '@repo/backend-common/config';
import { ClientMessageSchema } from '@repo/common/types';
import { prismaClient } from "@repo/db/client";
import http from "http";

const server = http.createServer((req, res) => {
  if (req.url === "/health" || req.url === "/") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }
  res.writeHead(404);
  res.end();
});

const wss = new WebSocketServer({ server, maxPayload: 1024 * 1024 });

server.listen(Number(process.env.PORT) || 8080);

interface User {
  ws: WebSocket;
  rooms: Set<string>;
  userId: string;
  name: string;
  // a client that stops answering pings is gone even if the socket never
  // reported a close, so it gets dropped on the next sweep
  alive: boolean;
}

/** ws -> user, so looking up the sender is a hash lookup and not a scan. */
const users = new Map<WebSocket, User>();
/** roomId -> the connections currently in it, for fan-out without scanning. */
const rooms = new Map<string, Set<WebSocket>>();

function checkUser(token: string): string | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (typeof decoded === "string" || !decoded || !decoded.userId) {
      return null;
    }

    return String(decoded.userId);
  } catch (e) {
    return null;
  }
}

function send(ws: WebSocket, payload: unknown) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

/** Fans a payload out to a room, skipping the connection that caused it. */
function broadcast(roomId: string, payload: unknown, except?: WebSocket) {
  const members = rooms.get(roomId);
  if (!members) return;
  const encoded = JSON.stringify(payload);
  for (const peer of members) {
    if (peer === except || peer.readyState !== WebSocket.OPEN) continue;
    peer.send(encoded);
  }
}

function joinRoom(user: User, roomId: string) {
  user.rooms.add(roomId);
  let members = rooms.get(roomId);
  if (!members) {
    members = new Set();
    rooms.set(roomId, members);
  }
  members.add(user.ws);
}

function leaveRoom(user: User, roomId: string) {
  user.rooms.delete(roomId);
  const members = rooms.get(roomId);
  if (!members) return;
  members.delete(user.ws);
  if (members.size === 0) rooms.delete(roomId);
}

/** The names of everyone currently connected to a room, deduplicated. */
function peopleIn(roomId: string) {
  const seen = new Map<string, string>();
  for (const ws of rooms.get(roomId) ?? []) {
    const user = users.get(ws);
    if (user) seen.set(user.userId, user.name);
  }
  return [...seen].map(([userId, name]) => ({ userId, name }));
}

function announcePresence(roomId: string) {
  broadcast(roomId, { type: "presence", roomId, users: peopleIn(roomId) });
}

wss.on('connection', async function connection(ws, request) {
  const url = request.url;
  if (!url) {
    ws.close();
    return;
  }

  const queryParams = new URLSearchParams(url.split('?')[1]);
  const token = queryParams.get('token') || "";
  const userId = checkUser(token);

  if (userId === null) {
    ws.close(4001, "Unauthorized");
    return;
  }

  const account = await prismaClient.user.findUnique({
    where: { id: userId },
    select: { name: true }
  });
  if (!account) {
    ws.close(4001, "Unauthorized");
    return;
  }
  // the socket can be torn down while the account lookup is in flight
  if (ws.readyState !== WebSocket.OPEN) return;

  const user: User = { ws, rooms: new Set(), userId, name: account.name, alive: true };
  users.set(ws, user);

  ws.on('pong', () => { user.alive = true; });

  ws.on('close', function close() {
    for (const roomId of [...user.rooms]) {
      leaveRoom(user, roomId);
      announcePresence(roomId);
    }
    users.delete(ws);
  });

  ws.on('error', function error() {
    ws.close();
  });

  // A template insert followed immediately by undo must finish storing its
  // shapes before the erase runs. Async event listeners alone race here.
  const enqueue = createMessageQueue((error) => console.error("could not process board message", error));
  ws.on('message', (data) => { void enqueue(() => message(data)); });

  const message = async (data: RawData) => {
    let raw: unknown;
    try {
      raw = JSON.parse(typeof data === "string" ? data : data.toString());
    } catch (e) {
      return;
    }

    const parsed = ClientMessageSchema.safeParse(raw);
    if (!parsed.success) return;
    const msg = parsed.data;

    const roomId = msg.roomId;
    const numericRoomId = Number(roomId);
    if (!Number.isInteger(numericRoomId)) return;

    if (msg.type === "join_room") {
      // a room id alone used to be enough to read and write someone else's
      // board, so membership is checked here rather than assumed
      const member = await prismaClient.roomMember.findUnique({
        where: { roomId_userId: { roomId: numericRoomId, userId } }
      });
      if (!member) {
        send(ws, { type: "error", roomId, message: "You are not a member of this room" });
        return;
      }
      if (ws.readyState !== WebSocket.OPEN) return;
      joinRoom(user, roomId);
      send(ws, { type: "joined", roomId });
      announcePresence(roomId);
      return;
    }

    // every message below is only meaningful once you are actually in the room
    if (!user.rooms.has(roomId)) return;

    if (msg.type === "leave_room") {
      leaveRoom(user, roomId);
      announcePresence(roomId);
      return;
    }

    if (msg.type === "cursor") {
      // presence is throwaway state, so it is relayed and never persisted
      broadcast(roomId, {
        type: "cursor",
        roomId,
        userId,
        name: user.name,
        x: msg.x,
        y: msg.y
      }, ws);
      return;
    }

    if (msg.type === "draw") {
      const shape = msg.shape;
      try {
        await prismaClient.chat.create({
          data: {
            roomId: numericRoomId,
            shapeId: shape.id,
            message: JSON.stringify({ shape }),
            userId
          }
        });
      } catch (e) {
        // a repeated shape id is a retry of a stroke already stored, which is
        // not worth logging or relaying a second time
        if (!isUniqueViolation(e)) {
          console.error("could not persist the shape", e);
        }
        return;
      }

      // the sender already drew the shape locally; echoing it back would
      // add a duplicate to their canvas
      broadcast(roomId, { type: "draw", roomId, shape }, ws);
      return;
    }

    if (msg.type === "update") {
      try {
        await prismaClient.$transaction(msg.shapes.map((shape) =>
          prismaClient.chat.upsert({
            where: { roomId_shapeId: { roomId: numericRoomId, shapeId: shape.id } },
            create: {
              roomId: numericRoomId,
              shapeId: shape.id,
              message: JSON.stringify({ shape }),
              userId
            },
            update: { message: JSON.stringify({ shape }) }
          })
        ));
      } catch (e) {
        console.error("could not update the shapes", e);
        return;
      }

      broadcast(roomId, { type: "update", roomId, shapes: msg.shapes }, ws);
      return;
    }

    if (msg.type === "erase") {
      try {
        await prismaClient.chat.deleteMany({
          where: { roomId: numericRoomId, shapeId: { in: msg.shapeIds } }
        });
      } catch (e) {
        console.error("could not erase the shapes", e);
        return;
      }

      broadcast(roomId, { type: "erase", roomId, shapeIds: msg.shapeIds }, ws);
    }
  };
});

function isUniqueViolation(e: unknown) {
  return typeof e === "object" && e !== null && "code" in e && e.code === "P2002";
}

// Sockets that die without a close frame (a laptop lid, a dropped network)
// would otherwise sit in the room forever and show up as ghost collaborators.
const heartbeat = setInterval(() => {
  for (const [ws, user] of users) {
    if (!user.alive) {
      ws.terminate();
      continue;
    }
    user.alive = false;
    ws.ping();
  }
}, 30_000);

wss.on('close', () => clearInterval(heartbeat));
