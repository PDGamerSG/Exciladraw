"use client";

import { WS_URL } from "@/config";
import { initDraw } from "@/draw";
import { useEffect, useRef, useState } from "react";
import { Canvas } from "./Canvas";

export function RoomCanvas({roomId}:{roomId:string}){
    const [socket,setSocket] = useState<WebSocket| null>(null);

    useEffect(()=>{
        const ws = new WebSocket(`${WS_URL}?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyMjVhZjlkNy03NGFkLTRiMTMtOWQyNy0xZjgzM2Y3MTMzNzIiLCJpYXQiOjE3ODA4MjA2NDJ9.C-BmLuWtnoef7R-5HMeTQPJ2yz6g1Wx2qf-FNqEpHiM`)
        ws.onopen = () =>{
            setSocket(ws);
            const data = JSON.stringify({
                type: "join_room",
                roomId
            });
            console.log(data);
            ws.send(data)
        }
    },[])
    if(!socket){
        return <div>
            Connecting to server....
        </div>
    }
    return <div>
        <Canvas roomId={roomId} socket={socket}></Canvas>
    </div>




}
