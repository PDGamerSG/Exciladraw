import { initDraw } from "@/draw";
import { useEffect, useRef } from "react";

export function Canvas({
    roomId,
    socket
}:{
    roomId:string;
    socket: WebSocket
}){

    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(()=>{
        if(canvasRef.current){
            initDraw(canvasRef.current,roomId,socket);
;        }
    },[canvasRef])
    return <div>
        <canvas ref={canvasRef} width={1920} height={1080} ></canvas>
        <div className="absolute bottom-0 right-0">
            <button className="bg-white text-black">Rect</button>
            <br />
            <br />
            <button className="bg-white text-black">Circle</button>
        </div>
    </div>
}
