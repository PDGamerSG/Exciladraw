"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Link2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";

export function ShareDialog({
    open,
    onClose,
    inviteCode,
    roomName,
}: {
    open: boolean;
    onClose: () => void;
    inviteCode?: string;
    roomName?: string;
}) {
    const [copied, setCopied] = useState(false);
    const [link, setLink] = useState("");

    useEffect(() => {
        // the origin is only knowable in the browser, so the link is built
        // after mount rather than guessed during the server render
        if (inviteCode) setLink(`${window.location.origin}/join/${inviteCode}`);
    }, [inviteCode]);

    useEffect(() => {
        if (!copied) return;
        const timer = setTimeout(() => setCopied(false), 2000);
        return () => clearTimeout(timer);
    }, [copied]);

    async function copy() {
        try {
            await navigator.clipboard.writeText(link);
            setCopied(true);
        } catch {
            // clipboard access needs a secure context; select the text instead
            // so there is still a way to get the link out
            const input = document.getElementById("invite-link") as HTMLInputElement | null;
            input?.select();
        }
    }

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Invite people to this board"
            description={
                inviteCode
                    ? "Anyone with this link can open the board and draw on it."
                    : undefined
            }
        >
            {inviteCode ? (
                <div className="flex flex-col gap-3">
                    <label htmlFor="invite-link" className="eyebrow">
                        {roomName ? `Link to ${roomName}` : "Invite link"}
                    </label>
                    <div className="flex gap-2">
                        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-ink-700 bg-ink-900 px-3">
                            <Link2 className="h-3.5 w-3.5 shrink-0 text-chalk-500" aria-hidden />
                            <input
                                id="invite-link"
                                readOnly
                                value={link}
                                onFocus={(e) => e.currentTarget.select()}
                                className="h-11 min-w-0 flex-1 bg-transparent font-mono text-xs text-chalk-300 outline-none"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={copy}
                            className={cn(
                                "inline-flex h-11 shrink-0 items-center gap-2 rounded-xl px-4 text-sm font-medium transition-colors duration-200",
                                copied
                                    ? "bg-pen-green text-ink-950"
                                    : "bg-amber-400 text-ink-950 hover:bg-amber-300"
                            )}
                        >
                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            {copied ? "Copied" : "Copy"}
                        </button>
                    </div>
                    <p className="text-xs leading-relaxed text-chalk-500">
                        People need an Exciladraw account to open the link. Everyone who joins
                        keeps the board in their room list.
                    </p>
                </div>
            ) : (
                <p className="text-sm leading-relaxed text-chalk-300">
                    Only the person who created this board can invite others. Ask them for the
                    link.
                </p>
            )}
        </Modal>
    );
}
