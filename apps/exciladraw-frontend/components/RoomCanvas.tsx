"use client";

import { WS_URL } from "@/config";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Canvas } from "./Canvas";

export function RoomCanvas({ roomId }: { roomId: string }) {
    const router = useRouter();
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/signin");
            return;
        }

        const ws = new WebSocket(`${WS_URL}?token=${token}`);
        ws.onopen = () => {
            setSocket(ws);
            ws.send(JSON.stringify({
                type: "join_room",
                roomId
            }));
        };
        ws.onerror = () => setError("could not reach the drawing server.");
        ws.onclose = () => {
            setSocket(null);
            setError((prev) => prev || "the connection to the drawing server was lost.");
        };
        return () => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: "leave_room", roomId }));
            }
            // the socket is being torn down on purpose, so don't surface it as an error
            ws.onclose = null;
            ws.onerror = null;
            ws.close();
        };
    }, [roomId, router]);

    if (!socket) {
        return (
            <div className="flex h-screen w-screen flex-col items-center justify-center gap-4 bg-[#121212]">
                {error ? (
                    <>
                        <p className="text-sm text-[#b4b4bb]">{error}</p>
                        <div className="flex items-center gap-2.5">
                            <button
                                onClick={() => window.location.reload()}
                                className="inline-flex h-9 items-center rounded-lg bg-[#232329] px-3.5 text-sm text-[#e3e3e8] transition-colors hover:bg-[#2e2d39]"
                            >
                                try again
                            </button>
                            <Link
                                href="/room"
                                className="inline-flex h-9 items-center rounded-lg px-3.5 text-sm text-[#b4b4bb] transition-colors hover:text-[#e3e3e8]"
                            >
                                back to your rooms
                            </Link>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center gap-3">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#3d3d44] border-t-[#a8a5ff]" />
                        <p className="text-sm text-[#b4b4bb]">Connecting to server…</p>
                    </div>
                )}
            </div>
        );
    }

    return <Canvas roomId={roomId} socket={socket} />;
}
