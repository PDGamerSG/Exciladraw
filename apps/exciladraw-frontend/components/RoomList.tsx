"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowRight,
    Loader2,
    LogOut,
    PenLine,
    Plus,
    Share2,
    Trash2,
    Users,
    KeyRound,
} from "lucide-react";
import { api, clearToken, errorMessage, getToken, isAuthError } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { ShareDialog } from "@/components/canvas/ShareDialog";
import { ThemeControl } from "@/components/ThemeControl";
import { ChangePasswordDialog } from "@/components/ChangePasswordDialog";
import { Wordmark } from "@/components/Wordmark";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type Room = {
    id: number;
    slug: string;
    isAdmin: boolean;
    memberCount: number;
    shapeCount: number;
    inviteCode?: string;
};

function plural(count: number, one: string, many: string) {
    return `${count} ${count === 1 ? one : many}`;
}

export function RoomList() {
    const router = useRouter();
    const [rooms, setRooms] = useState<Room[]>([]);
    const [roomName, setRoomName] = useState("");
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState("");
    const [sharing, setSharing] = useState<Room | null>(null);
    const [confirming, setConfirming] = useState<Room | null>(null);
    const [removing, setRemoving] = useState(false);
    const [passwordOpen, setPasswordOpen] = useState(false);
    const closePassword = useCallback(() => setPasswordOpen(false), []);

    const signOut = useCallback(() => {
        clearToken();
        router.push("/signin");
    }, [router]);

    useEffect(() => {
        if (!getToken()) {
            router.push("/signin");
            return;
        }
        let cancelled = false;
        api
            .get<{ rooms: Room[] }>("/room")
            .then((res) => {
                if (!cancelled) setRooms(res.data.rooms ?? []);
            })
            .catch((err) => {
                if (cancelled) return;
                // an expired or rejected token should send you back to sign in
                // rather than leaving you on an empty list
                if (isAuthError(err)) {
                    signOut();
                    return;
                }
                setError(errorMessage(err, "Couldn't load your boards."));
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [router, signOut]);

    async function createRoom(e: FormEvent) {
        e.preventDefault();
        const name = roomName.trim();
        if (!name) return;
        setError("");
        setCreating(true);
        try {
            const res = await api.post<{ roomId: number }>("/room", { name });
            router.push(`/canvas/${res.data.roomId}`);
        } catch (err) {
            setError(errorMessage(err, "Couldn't create that board. Try another name."));
            setCreating(false);
        }
    }

    async function removeRoom(room: Room) {
        setRemoving(true);
        try {
            await api.delete(`/room/${room.id}`);
            setRooms((prev) => prev.filter((r) => r.id !== room.id));
            setConfirming(null);
        } catch (err) {
            setError(errorMessage(err, "Couldn't remove that board."));
        } finally {
            setRemoving(false);
        }
    }

    return (
        <TooltipProvider delayDuration={400}>
            <div className="relative min-h-screen">

                <div className="relative mx-auto w-full max-w-4xl px-5 py-6 sm:px-8">
                    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-700/70 pb-6">
                        <Wordmark />
                        <div className="flex items-center gap-2">
                            <ThemeControl />
                            <button type="button" onClick={() => setPasswordOpen(true)} aria-label="Change password" title="Change password"
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-chalk-500 hover:bg-ink-850 hover:text-chalk-100 sm:w-auto sm:gap-2 sm:px-3">
                                <KeyRound className="h-4 w-4" />
                                <span className="hidden text-[13px] sm:inline">Password</span>
                            </button>
                            <button
                                type="button"
                                aria-label="Sign out"
                                onClick={signOut}
                                className="inline-flex h-9 items-center gap-2 rounded-lg px-3 text-[13px] text-chalk-500 transition-colors duration-200 hover:bg-ink-850 hover:text-chalk-100"
                            >
                                <LogOut className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Sign out</span>
                            </button>
                        </div>
                    </header>

                    <section className="rise mt-14">
                        <h1 className="mt-3 font-display text-[1.75rem] font-semibold tracking-tight text-chalk-100 sm:text-3xl">
                            Your boards
                        </h1>

                        <p className="mt-3 text-sm text-chalk-500">Pick up an idea, or make room for a new one.</p>

                        <form onSubmit={createRoom} className="mt-6 flex flex-col gap-2.5 sm:flex-row">
                            <Input
                                type="text"
                                aria-label="Board name"
                                placeholder="Name your new board"
                                value={roomName}
                                onChange={(e) => setRoomName(e.target.value)}
                                minLength={3}
                                maxLength={20}
                            />
                            <button
                                type="submit"
                                disabled={creating || roomName.trim().length < 3}
                                className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors duration-200 hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {creating ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Plus className="h-4 w-4" />
                                )}
                                Create board
                            </button>
                        </form>
                        <p className="mt-2 text-xs text-chalk-500">
                            3–20 characters · names are unique
                        </p>

                        {error && (
                            <p
                                role="alert"
                                className="mt-4 rounded-lg border border-destructive/25 bg-destructive/10 px-3.5 py-2.5 text-[13px] text-destructive"
                            >
                                {error}
                            </p>
                        )}
                    </section>

                    <section className="mt-10 pb-16" aria-label="Boards you can open">
                        {loading ? (
                            <div className="flex items-center gap-3 rounded-lg border border-ink-800 px-4 py-6 text-[13px] text-chalk-500">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Loading your boards…
                            </div>
                        ) : rooms.length === 0 ? (
                            <div className="flex flex-col items-center gap-3 rounded-lg border border-ink-700 px-6 py-14 text-center">
                                <PenLine className="h-5 w-5 text-chalk-500" aria-hidden />
                                <p className="max-w-xs text-[13px] leading-relaxed text-chalk-500">
                                    Nothing here yet. Name a board above and it opens straight onto
                                    a blank canvas.
                                </p>
                            </div>
                        ) : (
                            <ul className="divide-y divide-ink-700/70 border-y border-ink-700/70">
                                {rooms.map((room) => (
                                    <li
                                        key={room.id}
                                        className="group flex items-center gap-2 pr-2 transition-colors duration-200 hover:bg-ink-900"
                                    >
                                        <button
                                            type="button"
                                            onClick={() => router.push(`/canvas/${room.id}`)}
                                            className="flex min-w-0 flex-1 items-center gap-3.5 rounded-lg px-4 py-3.5 text-left"
                                        >
                                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-ink-700 bg-ink-850 font-mono text-[11px] text-chalk-500">
                                                <PenLine className="h-4 w-4" aria-hidden />
                                            </span>
                                            <span className="min-w-0 flex-1">
                                                <span className="block truncate text-sm font-medium text-chalk-100">
                                                    {room.slug}
                                                </span>
                                                <span className="mt-0.5 flex items-center gap-2 flex-wrap text-xs text-chalk-500">
                                                    <Users className="h-3 w-3" aria-hidden />
                                                    {plural(room.memberCount, "member", "members")}
                                                    <span aria-hidden>·</span>
                                                    {plural(room.shapeCount, "shape", "shapes")}
                                                    {!room.isAdmin && (
                                                        <>
                                                            <span aria-hidden>·</span>
                                                            <span className="text-amber-400">
                                                                Shared with you
                                                            </span>
                                                        </>
                                                    )}
                                                </span>
                                            </span>
                                            <ArrowRight className="h-4 w-4 shrink-0 text-chalk-500 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-chalk-100" />
                                        </button>

                                        <div className="flex shrink-0 items-center gap-0.5">
                                            {room.isAdmin && (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <button
                                                            type="button"
                                                            onClick={() => setSharing(room)}
                                                            aria-label={`Invite people to ${room.slug}`}
                                                            className="flex h-8 w-8 items-center justify-center rounded-lg text-chalk-500 transition-colors duration-150 hover:bg-ink-800 hover:text-chalk-100"
                                                        >
                                                            <Share2 className="h-3.5 w-3.5" />
                                                        </button>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="top">Invite people</TooltipContent>
                                                </Tooltip>
                                            )}
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <button
                                                        type="button"
                                                        onClick={() => setConfirming(room)}
                                                        aria-label={
                                                            room.isAdmin
                                                                ? `Delete ${room.slug}`
                                                                : `Leave ${room.slug}`
                                                        }
                                                        className="flex h-8 w-8 items-center justify-center rounded-lg text-chalk-500 transition-colors duration-150 hover:bg-destructive/12 hover:text-destructive"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </TooltipTrigger>
                                                <TooltipContent side="top">
                                                    {room.isAdmin ? "Delete board" : "Leave board"}
                                                </TooltipContent>
                                            </Tooltip>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                </div>

                {passwordOpen && <ChangePasswordDialog onClose={closePassword} />}
                <ShareDialog
                    open={sharing !== null}
                    onClose={() => setSharing(null)}
                    inviteCode={sharing?.inviteCode}
                    roomName={sharing?.slug}
                />

                <Modal
                    open={confirming !== null}
                    onClose={() => setConfirming(null)}
                    title={confirming?.isAdmin ? `Delete ${confirming.slug}?` : `Leave ${confirming?.slug}?`}
                    description={
                        confirming?.isAdmin
                            ? "The board and everything drawn on it is deleted for everyone. This can't be undone."
                            : "The board stays for everyone else. You'll need a new invite link to come back."
                    }
                >
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setConfirming(null)}
                            className="inline-flex h-10 items-center rounded-lg px-4 text-[13px] text-chalk-300 transition-colors hover:bg-ink-800 hover:text-chalk-100"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            disabled={removing}
                            onClick={() => confirming && removeRoom(confirming)}
                            className="inline-flex h-10 items-center gap-2 rounded-lg bg-destructive text-destructive-foreground px-4 text-[13px] font-medium transition-colors hover:opacity-90 disabled:opacity-60"
                        >
                            {removing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                            {confirming?.isAdmin ? "Delete board" : "Leave board"}
                        </button>
                    </div>
                </Modal>
            </div>
        </TooltipProvider>
    );
}
