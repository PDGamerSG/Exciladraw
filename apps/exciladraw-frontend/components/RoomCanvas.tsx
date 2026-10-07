"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { WS_URL } from "@/config";
import { api, clearToken, errorMessage, getToken, isAuthError } from "@/lib/api";
import { Canvas } from "./Canvas";

type RoomInfo = { id: number; slug: string; isAdmin: boolean; inviteCode?: string };

/** How long to wait before each reconnect attempt, in milliseconds. */
const BACKOFF = [500, 1000, 2000, 4000, 8000];

export function RoomCanvas({ roomId }: { roomId: string }) {
    const router = useRouter();
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const [room, setRoom] = useState<RoomInfo | null>(null);
    const [error, setError] = useState("");
    const [attempt, setAttempt] = useState(0);

    // the room's name and invite link come from the API, so the board can be
    // titled and shared without the websocket having to carry that
    useEffect(() => {
        let cancelled = false;
        api
            .get<{ room: RoomInfo }>(`/room/${roomId}`)
            .then((res) => {
                if (!cancelled) setRoom(res.data.room);
            })
            .catch((err) => {
                if (cancelled) return;
                if (isAuthError(err)) {
                    clearToken();
                    router.push("/signin");
                    return;
                }
                setError(errorMessage(err, "This board doesn't exist, or you're not a member of it."));
            });
        return () => {
            cancelled = true;
        };
    }, [roomId, router]);

    useEffect(() => {
        const token = getToken();
        if (!token) {
            router.push("/signin");
            return;
        }

        let disposed = false;
        let retryTimer: ReturnType<typeof setTimeout> | undefined;

        const ws = new WebSocket(`${WS_URL}?token=${encodeURIComponent(token)}`);

        ws.onopen = () => {
            if (disposed) return;
            setError("");
            setSocket(ws);
            ws.send(JSON.stringify({ type: "join_room", roomId }));
        };

        ws.onerror = () => {
            if (!disposed) setError("Can't reach the drawing server.");
        };

        ws.onclose = (event) => {
            if (disposed) return;
            setSocket(null);
            if (event.code === 4001) {
                clearToken();
                router.push("/signin");
                return;
            }
            // a dropped connection retries on its own, backing off each time,
            // rather than making you reload the page to get back on the board
            const delay = BACKOFF[Math.min(attempt, BACKOFF.length - 1)]!;
            if (attempt < BACKOFF.length) {
                setError("Reconnecting…");
                retryTimer = setTimeout(() => setAttempt((n) => n + 1), delay);
            } else {
                setError("Lost the connection to the drawing server.");
            }
        };

        return () => {
            disposed = true;
            clearTimeout(retryTimer);
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: "leave_room", roomId }));
            }
            ws.onclose = null;
            ws.onerror = null;
            ws.close();
        };
    }, [roomId, router, attempt]);

    if (!socket) {
        const reconnecting = error === "Reconnecting…";
        const fatal = error && !reconnecting;

        return (
            <div className="flex h-screen w-screen flex-col items-center justify-center gap-5 bg-board px-6 text-center">
                {fatal ? (
                    <>
                        <p className="max-w-sm text-sm leading-relaxed text-chalk-300">{error}</p>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setError("");
                                    setAttempt(0);
                                }}
                                className="inline-flex h-9 items-center rounded-xl bg-primary px-4 text-[13px] font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
                            >
                                Try again
                            </button>
                            <Link
                                href="/room"
                                className="inline-flex h-9 items-center rounded-xl px-4 text-[13px] text-chalk-500 transition-colors hover:text-chalk-100"
                            >
                                Back to your boards
                            </Link>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center gap-3.5">
                        <span className="h-7 w-7 animate-spin rounded-full border-2 border-ink-700 border-t-amber-400" />
                        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-chalk-500">
                            {reconnecting ? "Reconnecting" : "Opening the board"}
                        </p>
                    </div>
                )}
            </div>
        );
    }

    return (
        <Canvas
            roomId={roomId}
            socket={socket}
            roomName={room?.slug}
            inviteCode={room?.inviteCode}
        />
    );
}
