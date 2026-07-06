"use client";

import { WS_URL } from "@/config";
import { useEffect, useState } from "react";
import { Canvas } from "./Canvas";

export function RoomCanvas({ roomId }: { roomId: string }) {
    const [socket, setSocket] = useState<WebSocket | null>(null);

    useEffect(() => {
        const ws = new WebSocket(`${WS_URL}?token=${localStorage.getItem("token")}`);
        ws.onopen = () => {
            setSocket(ws);
            ws.send(JSON.stringify({
                type: "join_room",
                roomId
            }));
        };
        return () => {
            ws.close();
        };
    }, [roomId]);

    if (!socket) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-[#121212]">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#3d3d44] border-t-[#a8a5ff]" />
                    <p className="text-sm text-[#b4b4bb]">Connecting to server…</p>
                </div>
            </div>
        );
    }

    return <Canvas roomId={roomId} socket={socket} />;
}
