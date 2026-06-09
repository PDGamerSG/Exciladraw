import { WebSocket,WebSocketServer } from 'ws';
import jwt, { JwtPayload } from "jsonwebtoken";
import { JWT_SECRET } from '@repo/backend-common/config';
import {prismaClient} from "@repo/db/client";
const wss = new WebSocketServer({ port: 8080 });
interface User{
    ws: WebSocket,
    rooms: string[],
    userId: string
}

const users:User[] = [];

function checkUser(token:string):string | null{
    try{
        const decoded = jwt.verify(token,JWT_SECRET);
        //decoded as JwtPayload for removing the typeerror
        if(typeof decoded == "string"){
            return null;
        }
        if(!decoded || !(decoded as JwtPayload).userId){
            return null;
        }
        return  decoded.userId;
    }
    catch(e){
        return null
    }
}

wss.on('connection', function connection(ws,request) {
    const url = request.url; // ws://localhost:3000?token=123123
    // ["ws://localhost:3000","token=123123"]
    if(!url){
        return;
    }
    //the below line selects the token part and then uses that
    const queryParams = new URLSearchParams(url.split('?')[1]);
    const token = queryParams.get('token')|| "";
    const userId = checkUser(token);
    if(userId == null){
        ws.close()
        return null;
    }
    users.push({
        userId,
        rooms:[],
        ws
    })
    ws.on('message', async function message(data){
        // const parsedData = JSON.parse(data as unknown as string);
        let parsedData;
        if(typeof data !=="string"){
            parsedData = JSON.parse(data.toString());
        }else{
            parsedData = JSON.parse(data);
        }

        if(parsedData.type === "join_room"){
            const user = users.find(x => x.ws === ws);
            user?.rooms.push(parsedData.roomId);
        }
        if(parsedData.type === "leave_room"){
            const user = users.find(x => x.ws === ws);
            if(!user){
                return;
            }
            user.rooms = user?.rooms.filter(x => x === parsedData.room);
        }
        console.log("message received")
        console.log(parsedData);
        if(parsedData.type === "chat"){
            const roomId = parsedData.roomId;
            const message = parsedData.message;

            await prismaClient.chat.create({
                data:{
                    roomId:Number(roomId),
                    message,
                    userId
                }
            });
            users.forEach(user =>{
                if(user.rooms.includes(roomId)){
                    user.ws.send(JSON.stringify({
                        type:"chat",
                        message:message,
                        roomId
                    }))
                }
            })
        }
    })

});
