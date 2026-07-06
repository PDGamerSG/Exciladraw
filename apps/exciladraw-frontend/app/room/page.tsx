"use client";

import { HTTP_BACKEND } from "@/config";
import axios from "axios";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { ArrowRight, Loader2, LogOut, Pencil, Plus, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { onest } from "@/lib/fonts";
import { cn } from "@/lib/utils";

type Room = {
    id: number;
    slug?: string;
    name?: string;
};

export default function RoomPage() {
    const router = useRouter();
    const [rooms, setRooms] = useState<Room[]>([]);
    const [roomName, setRoomName] = useState("");
    const [loadingRooms, setLoadingRooms] = useState(true);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/signin");
            return;
        }
        axios
            .get(`${HTTP_BACKEND}/room`, { headers: { Authorization: token } })
            .then((res) => setRooms(res.data.rooms ?? []))
            .catch(() => setError("could not load your rooms."))
            .finally(() => setLoadingRooms(false));
    }, [router]);

    async function createRoom(e: FormEvent) {
        e.preventDefault();
        if (!roomName.trim()) return;
        setError("");
        setCreating(true);
        try {
            const token = localStorage.getItem("token");
            const res = await axios.post(
                `${HTTP_BACKEND}/room`,
                { name: roomName.trim() },
                { headers: { Authorization: token } }
            );
            router.push(`/canvas/${res.data.roomId}`);
        } catch (err: any) {
            setError(err?.response?.data?.message ?? "could not create the room. try another name.");
            setCreating(false);
        }
    }

    return (
        <div
            className={cn(
                onest.className,
                "dark relative min-h-screen w-full overflow-hidden bg-background text-foreground"
            )}
        >
            {/* ambient glow */}
            <div className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[720px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(168,165,255,0.12),transparent_65%)]" />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:44px_44px]" />

            <div className="relative mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-8">
                {/* header */}
                <header className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/10 bg-foreground/5 backdrop-blur-md">
                            <Pencil className="h-4 w-4 text-[#a8a5ff]" />
                        </div>
                        <span className="text-sm font-medium">exciladraw</span>
                    </div>
                    <button
                        onClick={() => {
                            localStorage.removeItem("token");
                            router.push("/signin");
                        }}
                        className="inline-flex h-9 items-center gap-2 rounded-xl border border-primary/10 bg-foreground/5 px-3.5 text-sm text-muted-foreground backdrop-blur-md transition-all duration-300 ease-[cubic-bezier(0.45,0.05,0.55,0.95)] hover:border-primary/20 hover:bg-primary/10 hover:text-foreground"
                    >
                        <LogOut className="h-3.5 w-3.5" /> sign out
                    </button>
                </header>

                {/* hero + create */}
                <div className="mt-14">
                    <h1 className="text-2xl font-semibold tracking-tight">your rooms</h1>
                    <p className="mt-1.5 text-sm text-muted-foreground">
                        create a room or jump back into one to start sketching.
                    </p>

                    <form onSubmit={createRoom} className="mt-6 flex gap-2.5">
                        <Input
                            type="text"
                            placeholder="room name"
                            value={roomName}
                            onChange={(e) => setRoomName(e.target.value)}
                        />
                        <button
                            type="submit"
                            disabled={creating || !roomName.trim()}
                            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl bg-foreground px-4 text-sm font-medium text-background transition-all duration-300 ease-[cubic-bezier(0.45,0.05,0.55,0.95)] hover:bg-foreground/85 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {creating ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Plus className="h-4 w-4" />
                            )}
                            create room
                        </button>
                    </form>

                    {error && (
                        <p className="mt-4 rounded-xl border border-destructive/20 bg-destructive/10 px-3.5 py-2.5 text-sm text-red-400">
                            {error}
                        </p>
                    )}
                </div>

                {/* rooms list */}
                <div className="mt-10 flex flex-col gap-2.5 pb-10">
                    {loadingRooms ? (
                        <div className="flex items-center gap-2.5 rounded-2xl border border-primary/10 bg-foreground/5 px-4 py-6 text-sm text-muted-foreground backdrop-blur-md">
                            <Loader2 className="h-4 w-4 animate-spin" /> loading your rooms…
                        </div>
                    ) : rooms.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-primary/15 bg-foreground/[0.03] px-4 py-12 text-center backdrop-blur-md">
                            <Users className="h-5 w-5 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                                no rooms yet — create your first one above.
                            </p>
                        </div>
                    ) : (
                        rooms.map((room) => (
                            <button
                                key={room.id}
                                onClick={() => router.push(`/canvas/${room.id}`)}
                                className="group flex items-center justify-between rounded-2xl border border-primary/10 bg-foreground/5 px-4 py-3.5 text-left backdrop-blur-md transition-all duration-300 ease-[cubic-bezier(0.45,0.05,0.55,0.95)] hover:border-primary/20 hover:bg-primary/10"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/10 bg-foreground/5">
                                        <Users className="h-4 w-4 text-[#a8a5ff]" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">
                                            {room.slug ?? room.name ?? `room ${room.id}`}
                                        </p>
                                        <p className="text-xs text-muted-foreground">room #{room.id}</p>
                                    </div>
                                </div>
                                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-foreground" />
                            </button>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
