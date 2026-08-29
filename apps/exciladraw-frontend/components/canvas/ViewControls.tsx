"use client";

import { Maximize2, Minus, Plus, Redo2, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

function IconButton({
    label,
    shortcut,
    onClick,
    disabled,
    children,
}: {
    label: string;
    shortcut?: string;
    onClick: () => void;
    disabled?: boolean;
    children: React.ReactNode;
}) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <button
                    type="button"
                    onClick={onClick}
                    disabled={disabled}
                    aria-label={label}
                    className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-lg text-chalk-300 transition-colors duration-150",
                        "hover:bg-ink-750 hover:text-chalk-100",
                        "disabled:pointer-events-none disabled:opacity-30",
                        "[&_svg]:size-4 [&_svg]:shrink-0"
                    )}
                >
                    {children}
                </button>
            </TooltipTrigger>
            <TooltipContent side="top">
                {label}
                {shortcut && (
                    <kbd className="ml-2 font-mono text-[10px] text-chalk-500">{shortcut}</kbd>
                )}
            </TooltipContent>
        </Tooltip>
    );
}

export function ViewControls({
    zoom,
    onZoomIn,
    onZoomOut,
    onZoomReset,
    onZoomToFit,
    onUndo,
    onRedo,
    canUndo,
    canRedo,
}: {
    zoom: number;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onZoomReset: () => void;
    onZoomToFit: () => void;
    onUndo: () => void;
    onRedo: () => void;
    canUndo: boolean;
    canRedo: boolean;
}) {
    return (
        <div className="pointer-events-auto flex items-center gap-2">
            <div className="panel flex items-center rounded-xl p-1">
                <IconButton label="Zoom out" shortcut="Ctrl −" onClick={onZoomOut}>
                    <Minus />
                </IconButton>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            type="button"
                            onClick={onZoomReset}
                            aria-label={`Zoom is ${Math.round(zoom * 100)} percent. Reset to 100 percent`}
                            className="h-8 min-w-[54px] rounded-lg px-1 font-mono text-[11px] tabular-nums text-chalk-300 transition-colors duration-150 hover:bg-ink-750 hover:text-chalk-100"
                        >
                            {Math.round(zoom * 100)}%
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="top">Reset zoom to 100%</TooltipContent>
                </Tooltip>
                <IconButton label="Zoom in" shortcut="Ctrl +" onClick={onZoomIn}>
                    <Plus />
                </IconButton>
                <div className="mx-1 h-5 w-px bg-ink-700" aria-hidden />
                <IconButton label="Fit drawing to screen" shortcut="Shift 1" onClick={onZoomToFit}>
                    <Maximize2 />
                </IconButton>
            </div>

            <div className="panel flex items-center rounded-xl p-1">
                <IconButton label="Undo" shortcut="Ctrl Z" onClick={onUndo} disabled={!canUndo}>
                    <Undo2 />
                </IconButton>
                <IconButton label="Redo" shortcut="Ctrl ⇧ Z" onClick={onRedo} disabled={!canRedo}>
                    <Redo2 />
                </IconButton>
            </div>
        </div>
    );
}
