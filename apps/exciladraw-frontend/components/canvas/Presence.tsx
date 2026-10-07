"use client";

import type { Peer } from "@/draw/Board";
import { peerColor } from "@/draw/render";
import { displayColor } from "@/draw/theme";
import { useTheme } from "@/lib/theme";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

function initials(name: string) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "?";
    if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
    return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

const MAX_SHOWN = 4;

/** Who else is on the board right now, coloured to match their cursor. */
export function Presence({ peers }: { peers: Peer[] }) {
    const { theme } = useTheme();
    if (peers.length <= 1) return null;

    const shown = peers.slice(0, MAX_SHOWN);
    const overflow = peers.length - shown.length;

    return (
        <div className="panel pointer-events-auto flex items-center gap-2 rounded-xl px-2.5 py-1.5">
            <span className="relative flex h-1.5 w-1.5" aria-hidden>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pen-green opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-pen-green" />
            </span>
            <span className="sr-only">{peers.length} people are on this board</span>
            <div className="flex -space-x-1.5">
                {shown.map((peer) => (
                    <Tooltip key={peer.userId}>
                        <TooltipTrigger asChild>
                            <span
                                className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-ink-850 font-mono text-[9px] font-medium text-primary-foreground"
                                style={{ backgroundColor: displayColor(peerColor(peer.userId), theme) }}
                            >
                                {initials(peer.name)}
                            </span>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">{peer.name}</TooltipContent>
                    </Tooltip>
                ))}
                {overflow > 0 && (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-ink-850 bg-ink-700 font-mono text-[9px] text-chalk-300">
                        +{overflow}
                    </span>
                )}
            </div>
        </div>
    );
}
