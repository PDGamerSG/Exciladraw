import express from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";
import { middleware } from "./middleware";
import { CreateUserSchema,SigninSchema,CreateRoomSchema } from "@repo/common/types";
import {prismaClient} from "@repo/db/client";
import cors from "cors";
import bcrypt from "bcrypt";
const app = express();

app.use(express.json());
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.get("/health", (req, res) => {
    res.json({ status: "ok" });
})
app.post("/signup",async (req,res) =>{
    const parsedData = CreateUserSchema.safeParse(req.body);
    if(!parsedData.success){
        res.status(400).json({
            message:"Incorrect inputs"
        })
        return;
    }
    try{
        const hashedPassword = await bcrypt.hash(parsedData.data.password,10)
        const user = await prismaClient.user.create({
            data:{
                email: parsedData.data?.username,
                //TODO hash the password
                password: hashedPassword,
                name: parsedData.data.name
            }
        })
        res.json({
            userId: user.id
        })
    }
    catch(e){
        res.status(411).json({
            message:"User already exists with this username"
        })
    }
})
app.post("/signin",async (req,res) =>{
    const parsedData = SigninSchema.safeParse(req.body);
    if(!parsedData.success){
        res.status(400).json({
            message:"Incorrect inputs"
        })
        return;
    }
    const user = await prismaClient.user.findFirst({
        where:{
            email: parsedData.data.username
        }
    })
    if(!user){
        res.status(403).json({
            message:"Not authorized"
        })
        return;
    }
    const passwordMatch = await bcrypt.compare(parsedData.data.password, user.password);
    if (!passwordMatch) {
        res.status(403).json({ message: "Not authorized" });
        return;
    }
    const token = jwt.sign({
        userId: user?.id
    },JWT_SECRET);
    res.json({
        token
    })
})
app.post("/room",middleware,async (req,res) =>{
    const parsedData = CreateRoomSchema.safeParse(req.body);
    if(!parsedData.success){
        res.status(400).json({
            message:"Incorrect inputs"
        })
        return;
    }
    //@ts-ignore
    const userId = req.userId;
    try{
        const room = await prismaClient.room.create({
            data:{
                slug:parsedData.data.name,
                adminId:userId
            }
        })
        res.json({
            roomId: room.id
        })
    }
    catch(e){
        res.status(411).json({
            message:"Room already exits with this name"
        })
    }
})

app.get("/chats/:roomId",middleware,async (req,res) => {
    const roomId = Number(req.params.roomId);
    if(!Number.isInteger(roomId)){
        res.status(400).json({
            message:"Invalid room id"
        })
        return;
    }
    try{
        const messages = await prismaClient.chat.findMany({
            where:{
                roomId: roomId
            },
            orderBy:{
                id: "desc"
            },
            take: 1000
        });
        // newest first keeps the take to the most recent strokes, but they have
        // to be replayed oldest first so the board is drawn in the right order
        res.json({
            messages: messages.reverse()
        })
    }
    catch(e){
        console.error(e);
        res.status(500).json({
            message:"Could not load this room"
        })
    }
})
app.get("/room/:slug",middleware,async (req,res) => {
    const slug = String(req.params.slug ?? "");
    const room = await prismaClient.room.findFirst({
        where:{
            slug
        }
    });
    if(!room){
        res.status(404).json({
            message:"Room not found"
        })
        return;
    }
    res.json({
        room
    })
})
app.get("/room", middleware, async (req, res) => {
      //@ts-ignore
      const userId = req.userId;
      const rooms = await prismaClient.room.findMany({
          where: { adminId: userId },
          orderBy: { id: "desc" }
      });
      res.json({ rooms });
  })
app.listen(Number(process.env.PORT) || 3001);
