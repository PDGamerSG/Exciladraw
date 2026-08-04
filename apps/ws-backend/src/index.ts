import { WebSocket, WebSocketServer } from 'ws';
import jwt, { JwtPayload } from "jsonwebtoken";
import { JWT_SECRET } from '@repo/backend-common/config';
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

const wss = new WebSocketServer({ server });

server.listen(Number(process.env.PORT) || 8080);

interface User {
  ws: WebSocket,
  rooms: string[],
  userId: string
}

const users: User[] = [];

function checkUser(token: string): string | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (typeof decoded == "string") {
      return null;
    }

    if (!decoded || !decoded.userId) {
      return null;
    }

    return decoded.userId;
  } catch(e) {
    return null;
  }
}

wss.on('connection', function connection(ws, request) {
  const url = request.url;
  if (!url) {
    return;
  }
  const queryParams = new URLSearchParams(url.split('?')[1]);
  const token = queryParams.get('token') || "";
  const userId = checkUser(token);

  if (userId == null) {
    ws.close()
    return null;
  }

  users.push({
    userId,
    rooms: [],
    ws
  })

  ws.on('close', function close() {
    const index = users.findIndex(x => x.ws === ws);
    if (index !== -1) {
      users.splice(index, 1);
    }
  });

  ws.on('error', function error() {
    ws.close();
  });

  ws.on('message', async function message(data) {
    let parsedData;
    try {
      // {type: "join_room", roomId: "1"}
      parsedData = JSON.parse(typeof data === "string" ? data : data.toString());
    } catch (e) {
      return;
    }

    if (!parsedData || typeof parsedData.type !== "string") {
      return;
    }

    const user = users.find(x => x.ws === ws);
    if (!user) {
      return;
    }

    if (parsedData.type === "join_room") {
      const roomId = String(parsedData.roomId);
      if (!user.rooms.includes(roomId)) {
        user.rooms.push(roomId);
      }
      return;
    }

    if (parsedData.type === "leave_room") {
      const roomId = String(parsedData.roomId);
      user.rooms = user.rooms.filter(x => x !== roomId);
      return;
    }

    if (parsedData.type === "chat") {
      const roomId = String(parsedData.roomId);
      const message = parsedData.message;

      if (!user.rooms.includes(roomId) || typeof message !== "string") {
        return;
      }

      const numericRoomId = Number(roomId);
      if (!Number.isInteger(numericRoomId)) {
        return;
      }

      try {
        await prismaClient.chat.create({
          data: {
            roomId: numericRoomId,
            message,
            userId
          }
        });
      } catch (e) {
        console.error("could not persist the message", e);
        return;
      }

      users.forEach(other => {
        // the sender already drew the shape locally; echoing it back would
        // add a duplicate to their canvas
        if (other.ws === ws) {
          return;
        }
        if (other.rooms.includes(roomId) && other.ws.readyState === WebSocket.OPEN) {
          other.ws.send(JSON.stringify({
            type: "chat",
            message: message,
            roomId
          }))
        }
      })
    }

  });

});
