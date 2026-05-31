import { WebSocketServer } from 'ws';
import jwt, { JwtPayload } from "jsonwebtoken";
import { JWT_SECRET } from '@repo/backend-common/config';
const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', function connection(ws,request) {
    const url = request.url; // ws://localhost:3000?token=123123
    // ["ws://localhost:3000","token=123123"]
    if(!url){
        return;
    }
    //the below line selects the token part and then uses that
    const queryParams = new URLSearchParams(url.split('?')[1]);
    const token = queryParams.get('token')|| "";
    const decoded = jwt.verify(token,JWT_SECRET);
    //decoded as JwtPayload for removing the typeerror
    if(!decoded || !(decoded as JwtPayload).userId){
        ws.close();
        return;
    }
    ws.on('message', function message(data) {
        ws.send("pong");
    });
});
