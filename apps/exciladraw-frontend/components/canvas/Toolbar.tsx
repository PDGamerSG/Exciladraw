"use client";

import {
    Circle,
    Diamond,
    Eraser,
    Hand,
    Minus,
    MousePointer2,
    MoveRight,
    Pencil,
    Square,
    Type,
} from "lucide-react";
import type { Tool } from "@/draw/Board";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type ToolSpec = {
    tool: Tool;
    icon: React.ReactNode;
    label: string;
    /** The digit shown on the key cap; the letter is the mnemonic alias. */
    digit: string;
    letter: string;
};

export const TOOLS: ToolSpec[] = [
    { tool: "select", icon: <MousePointer2 />, label: "Select", digit: "1", letter: "V" },
    { tool: "hand", icon: <Hand />, label: "Pan", digit: "2", letter: "H" },
    { tool: "rect", icon: <Square />, label: "Rectangle", digit: "3", letter: "R" },
    { tool: "diamond", icon: <Diamond />, label: "Diamond", digit: "4", letter: "D" },
    { tool: "ellipse", icon: <Circle />, label: "Ellipse", digit: "5", letter: "O" },
    { tool: "arrow", icon: <MoveRight />, label: "Arrow", digit: "6", letter: "A" },
    { tool: "line", icon: <Minus />, label: "Line", digit: "7", letter: "L" },
    { tool: "pencil", icon: <Pencil />, label: "Draw", digit: "8", letter: "P" },
    { tool: "text", icon: <Type />, label: "Text", digit: "9", letter: "T" },
    { tool: "eraser", icon: <Eraser />, label: "Eraser", digit: "0", letter: "E" },
];

export function Toolbar({
    selectedTool,
    setSelectedTool,
}: {
    selectedTool: Tool;
    setSelectedTool: (t: Tool) => void;
}) {
    return (
        <div
            role="toolbar"
            aria-label="Drawing tools"
            aria-orientation="horizontal"
            className="panel pointer-events-auto flex items-center gap-0.5 rounded-xl p-1"
        >
            {TOOLS.map(({ tool, icon, label, digit, letter }) => {
                const active = selectedTool === tool;
                return (
                    <Tooltip key={tool}>
                        <TooltipTrigger asChild>
                            <button
                                type="button"
                                aria-label={label}
                                aria-pressed={active}
                                onClick={() => setSelectedTool(tool)}
                                className={cn(
                                    "relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors duration-150",
                                    "text-chalk-300 hover:bg-ink-750 hover:text-chalk-100",
                                    "[&_svg]:size-[18px] [&_svg]:shrink-0",
                                    active &&
                                        "bg-amber-400 text-ink-950 shadow-[0_1px_8px_-1px_var(--amber-400)] hover:bg-amber-400 hover:text-ink-950"
                                )}
                            >
                                {icon}
                                <span
                                    aria-hidden
                                    className={cn(
                                        "pointer-events-none absolute bottom-0.5 right-1 font-mono text-[9px] leading-none",
                                        active ? "text-ink-950/55" : "text-chalk-500"
                                    )}
                                >
                                    {digit}
                                </span>
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                            {label}
                            <kbd className="ml-2 font-mono text-[10px] text-ink-950/60">
                                {letter} · {digit}
                            </kbd>
                        </TooltipContent>
                    </Tooltip>
                );
            })}
        </div>
    );
}
