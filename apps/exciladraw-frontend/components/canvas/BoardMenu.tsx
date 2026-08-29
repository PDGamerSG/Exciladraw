"use client";

import Link from "next/link";
import { ArrowLeft, Download, Keyboard, LogOut, Menu, Trash2 } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const itemClass =
    "gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-chalk-300 focus:bg-ink-750 focus:text-chalk-100 [&_svg]:size-4 [&_svg]:text-chalk-500";

export function BoardMenu({
    onExport,
    onClearBoard,
    onShowShortcuts,
    onSignOut,
    canClear,
}: {
    onExport: () => void;
    onClearBoard: () => void;
    onShowShortcuts: () => void;
    onSignOut: () => void;
    canClear: boolean;
}) {
    return (
        <DropdownMenu>
            <Tooltip>
                <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                        <button
                            type="button"
                            aria-label="Board menu"
                            className="panel pointer-events-auto flex h-9 w-9 items-center justify-center rounded-xl text-chalk-300 transition-colors duration-150 hover:text-chalk-100"
                        >
                            <Menu className="h-[18px] w-[18px]" />
                        </button>
                    </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom">Board menu</TooltipContent>
            </Tooltip>

            <DropdownMenuContent
                align="start"
                sideOffset={8}
                className="panel w-56 rounded-xl border-ink-700 bg-ink-850 p-1.5 text-chalk-100"
            >
                <DropdownMenuItem asChild className={itemClass}>
                    <Link href="/room">
                        <ArrowLeft />
                        Back to your boards
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={onExport} className={itemClass}>
                    <Download />
                    Export as PNG
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={onShowShortcuts} className={itemClass}>
                    <Keyboard />
                    Keyboard shortcuts
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-1.5 bg-ink-700" />

                <DropdownMenuItem
                    onSelect={onClearBoard}
                    disabled={!canClear}
                    className="gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-chalk-300 focus:bg-destructive/12 focus:text-destructive data-[disabled]:opacity-40 [&_svg]:size-4 [&_svg]:text-chalk-500 [&_svg]:focus:text-destructive"
                >
                    <Trash2 />
                    Erase everything
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={onSignOut} className={itemClass}>
                    <LogOut />
                    Sign out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
