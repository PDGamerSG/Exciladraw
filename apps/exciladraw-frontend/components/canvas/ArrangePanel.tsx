"use client";

import { AlignStartVertical, AlignCenterVertical, AlignEndVertical, AlignStartHorizontal, AlignCenterHorizontal, AlignEndHorizontal, AlignHorizontalDistributeCenter, AlignVerticalDistributeCenter } from "lucide-react";
import type { Arrangement } from "@/draw/arrange";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const actions = [
    { action: "left", label: "Align left", icon: AlignStartVertical },
    { action: "center", label: "Align horizontal centers", icon: AlignCenterVertical },
    { action: "right", label: "Align right", icon: AlignEndVertical },
    { action: "top", label: "Align top", icon: AlignStartHorizontal },
    { action: "middle", label: "Align vertical centers", icon: AlignCenterHorizontal },
    { action: "bottom", label: "Align bottom", icon: AlignEndHorizontal },
    { action: "horizontal", label: "Distribute horizontally", icon: AlignHorizontalDistributeCenter },
    { action: "vertical", label: "Distribute vertically", icon: AlignVerticalDistributeCenter },
] as const;

export function ArrangePanel({ count, onArrange }: { count: number; onArrange: (action: Arrangement) => void }) {
    return (
        <section aria-label="Arrange selection" className="panel pointer-events-auto mt-2 rounded-xl p-3">
            <h2 className="eyebrow mb-2">Arrange</h2>
            <div className="grid grid-cols-4 gap-1">
                {actions.map(({ action, label, icon: Icon }) => (
                    <Tooltip key={action}>
                        <TooltipTrigger asChild>
                            <button type="button" aria-label={label} onClick={() => onArrange(action)}
                                disabled={count < (action === "horizontal" || action === "vertical" ? 3 : 2)}
                                className="flex h-9 w-9 items-center justify-center rounded-lg text-chalk-300 hover:bg-ink-750 hover:text-chalk-100 focus-visible:outline-2 focus-visible:outline-amber-400 disabled:opacity-30">
                                <Icon className="h-4 w-4" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent>{label}{(action === "horizontal" || action === "vertical") && count < 3 ? " (select at least 3)" : ""}</TooltipContent>
                    </Tooltip>
                ))}
            </div>
        </section>
    );
}
