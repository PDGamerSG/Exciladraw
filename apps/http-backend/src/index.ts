import express, { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";
import { middleware, rateLimit } from "./middleware";
import {
    CreateUserSchema,
    SigninSchema,
    CreateRoomSchema,
    JoinRoomSchema
} from "@repo/common/types";
import { prismaClient } from "@repo/db/client";
import cors from "cors";
import bcrypt from "bcrypt";

const app = express();

// the drawing history for a busy room is the largest thing this API accepts,
// and an unbounded body is a trivial way to exhaust memory
app.use(express.json({ limit: "1mb" }));
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));

// express hands the handler's rejection to the error middleware only for sync
// throws, so async handlers are wrapped rather than each growing a try/catch
type Handler = (req: Request, res: Response) => Promise<unknown> | unknown;
const route = (handler: Handler) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req, res)).catch(next);
};

const authLimiter = rateLimit({ windowMs: 60_000, max: 20 });

function signToken(userId: string) {
    // an unexpiring token stays valid forever once it leaks out of localStorage
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
}

/** Rooms are private: everything below reads through the membership table. */
async function isMember(roomId: number, userId: string) {
    const member = await prismaClient.roomMember.findUnique({
        where: { roomId_userId: { roomId, userId } }
    });
    return member !== null;
}

app.get("/health", (req, res) => {
    res.json({ status: "ok" });
});

app.post("/signup", authLimiter, route(async (req, res) => {
    const parsedData = CreateUserSchema.safeParse(req.body);
    if (!parsedData.success) {
        res.status(400).json({ message: "Incorrect inputs" });
        return;
    }

    const email = parsedData.data.username.toLowerCase();
    const hashedPassword = await bcrypt.hash(parsedData.data.password, 10);

    try {
        const user = await prismaClient.user.create({
            data: {
                email,
                password: hashedPassword,
                name: parsedData.data.name
            }
        });
        // signing the user straight in saves a redundant round trip through
        // the sign in form right after creating the account
        res.json({ userId: user.id, token: signToken(user.id), name: user.name });
    } catch (e) {
        res.status(409).json({ message: "An account with this email already exists" });
    }
}));

app.post("/signin", authLimiter, route(async (req, res) => {
    const parsedData = SigninSchema.safeParse(req.body);
    if (!parsedData.success) {
        res.status(400).json({ message: "Incorrect inputs" });
        return;
    }

    const user = await prismaClient.user.findFirst({
        where: { email: parsedData.data.username.toLowerCase() }
    });

    // compare against a throwaway hash when the account is missing, so a wrong
    // email and a wrong password take the same amount of time to answer
    const hash = user?.password ?? "$2b$10$M0dGpSDA9tShvo1zHyIHEuc8Zc9DAmSPMCkTZbcvT7ivmnJm25epi";
    const passwordMatch = await bcrypt.compare(parsedData.data.password, hash);

    if (!user || !passwordMatch) {
        res.status(403).json({ message: "Incorrect email or password" });
        return;
    }

    res.json({ token: signToken(user.id), name: user.name });
}));

app.get("/me", middleware, route(async (req, res) => {
    const user = await prismaClient.user.findUnique({
        where: { id: req.userId! },
        select: { id: true, name: true, email: true }
    });
    if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
    }
    res.json({ user });
}));

app.post("/room", middleware, route(async (req, res) => {
    const parsedData = CreateRoomSchema.safeParse(req.body);
    if (!parsedData.success) {
        res.status(400).json({ message: "Room names are 3 to 20 characters" });
        return;
    }

    const userId = req.userId!;
    try {
        const room = await prismaClient.room.create({
            data: {
                slug: parsedData.data.name,
                adminId: userId,
                // the creator is a member like anyone else, so a single
                // membership check covers both owners and invitees
                members: { create: { userId } }
            }
        });
        res.json({ roomId: room.id, inviteCode: room.inviteCode });
    } catch (e) {
        res.status(409).json({ message: "A room already exists with this name" });
    }
}));

/** Joining is by invite code, so a guessed room id is not enough to get in. */
app.post("/room/join", middleware, route(async (req, res) => {
    const parsedData = JoinRoomSchema.safeParse(req.body);
    if (!parsedData.success) {
        res.status(400).json({ message: "Invalid invite code" });
        return;
    }

    const room = await prismaClient.room.findUnique({
        where: { inviteCode: parsedData.data.inviteCode }
    });
    if (!room) {
        res.status(404).json({ message: "That invite link is no longer valid" });
        return;
    }

    const userId = req.userId!;
    await prismaClient.roomMember.upsert({
        where: { roomId_userId: { roomId: room.id, userId } },
        create: { roomId: room.id, userId },
        update: {}
    });

    res.json({ roomId: room.id, slug: room.slug });
}));

app.get("/room", middleware, route(async (req, res) => {
    const memberships = await prismaClient.roomMember.findMany({
        where: { userId: req.userId! },
        orderBy: { roomId: "desc" },
        include: {
            room: {
                include: { _count: { select: { members: true, chats: true } } }
            }
        }
    });

    res.json({
        rooms: memberships.map(({ room }) => ({
            id: room.id,
            slug: room.slug,
            createdAt: room.createAt,
            isAdmin: room.adminId === req.userId,
            memberCount: room._count.members,
            shapeCount: room._count.chats,
            // only the owner can hand out the invite link
            inviteCode: room.adminId === req.userId ? room.inviteCode : undefined
        }))
    });
}));

app.get("/room/:roomId", middleware, route(async (req, res) => {
    const roomId = Number(req.params.roomId);
    if (!Number.isInteger(roomId)) {
        res.status(400).json({ message: "Invalid room id" });
        return;
    }

    const room = await prismaClient.room.findUnique({
        where: { id: roomId },
        include: { _count: { select: { members: true } } }
    });
    if (!room || !(await isMember(roomId, req.userId!))) {
        // an existing room you are not in answers the same as a missing one,
        // so the endpoint cannot be used to enumerate other people's boards
        res.status(404).json({ message: "Room not found" });
        return;
    }

    res.json({
        room: {
            id: room.id,
            slug: room.slug,
            isAdmin: room.adminId === req.userId,
            memberCount: room._count.members,
            inviteCode: room.adminId === req.userId ? room.inviteCode : undefined
        }
    });
}));

app.delete("/room/:roomId", middleware, route(async (req, res) => {
    const roomId = Number(req.params.roomId);
    if (!Number.isInteger(roomId)) {
        res.status(400).json({ message: "Invalid room id" });
        return;
    }

    const room = await prismaClient.room.findUnique({ where: { id: roomId } });
    if (!room || !(await isMember(roomId, req.userId!))) {
        res.status(404).json({ message: "Room not found" });
        return;
    }

    if (room.adminId === req.userId) {
        await prismaClient.room.delete({ where: { id: roomId } });
    } else {
        // a guest leaves the room rather than deleting everyone else's board
        await prismaClient.roomMember.delete({
            where: { roomId_userId: { roomId, userId: req.userId! } }
        });
    }

    res.json({ ok: true });
}));

app.get("/chats/:roomId", middleware, route(async (req, res) => {
    const roomId = Number(req.params.roomId);
    if (!Number.isInteger(roomId)) {
        res.status(400).json({ message: "Invalid room id" });
        return;
    }

    if (!(await isMember(roomId, req.userId!))) {
        res.status(404).json({ message: "Room not found" });
        return;
    }

    const messages = await prismaClient.chat.findMany({
        where: { roomId },
        orderBy: { id: "desc" },
        take: 5000,
        select: { id: true, shapeId: true, message: true }
    });

    // newest first keeps the take to the most recent strokes, but they have
    // to be replayed oldest first so the board is drawn in the right order
    res.json({ messages: messages.reverse() });
}));

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
    console.error(err);
    if (res.headersSent) return;
    res.status(500).json({ message: "Something went wrong" });
});

app.listen(Number(process.env.PORT) || 3001);
