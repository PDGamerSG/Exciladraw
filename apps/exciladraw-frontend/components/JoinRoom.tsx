"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, errorMessage, getToken, isAuthError } from "@/lib/api";
import { Wordmark } from "./Wordmark";

/**
 * Redeems an invite link. Signing in first is required, so an unauthenticated
 * visitor is sent to sign in with the invite remembered — landing straight on
 * the board once they are back.
 */
export function JoinRoom({ code }: { code: string }) {
    const router = useRouter();
    const [error, setError] = useState("");
    const claimed = useRef(false);

    useEffect(() => {
        // react runs effects twice in development; redeeming twice is harmless
        // but the second failure would overwrite a successful redirect
        if (claimed.current) return;
        claimed.current = true;

        if (!getToken()) {
            router.replace(`/signin?next=${encodeURIComponent(`/join/${code}`)}`);
            return;
        }

        api
            .post<{ roomId: number }>("/room/join", { inviteCode: code })
            .then((res) => router.replace(`/canvas/${res.data.roomId}`))
            .catch((err) => {
                if (isAuthError(err)) {
                    router.replace(`/signin?next=${encodeURIComponent(`/join/${code}`)}`);
                    return;
                }
                setError(errorMessage(err, "That invite link is no longer valid."));
            });
    }, [code, router]);

    return (
        <main className="relative flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
            <div className="lamp pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[640px] -translate-x-1/2" />
            <div className="grid-paper pointer-events-none absolute inset-0" />

            <div className="relative flex flex-col items-center gap-6">
                <Wordmark />
                {error ? (
                    <>
                        <p className="max-w-sm text-sm leading-relaxed text-chalk-300">{error}</p>
                        <Link
                            href="/room"
                            className="inline-flex h-10 items-center rounded-xl bg-amber-400 px-4 text-[13px] font-medium text-ink-950 transition-colors hover:bg-amber-300"
                        >
                            Go to your boards
                        </Link>
                    </>
                ) : (
                    <div className="flex flex-col items-center gap-3.5">
                        <span className="h-7 w-7 animate-spin rounded-full border-2 border-ink-700 border-t-amber-400" />
                        <p className="eyebrow">Opening the board</p>
                    </div>
                )}
            </div>
        </main>
    );
}
