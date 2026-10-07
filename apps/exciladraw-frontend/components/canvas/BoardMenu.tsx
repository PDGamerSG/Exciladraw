"use client";

import Link from "next/link";
import { useRef } from "react";
import { ArrowLeft, Download, Keyboard, LogOut, Menu, Trash2, LayoutTemplate, FolderOpen, Save } from "lucide-react";
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
    onExportSvg,
    onExportSelectionSvg,
    onTemplates,
    onImport,
    onSave,
    onSaveSelection,
    canSaveSelection,
    ready,
    onClearBoard,
    onShowShortcuts,
    onSignOut,
    canClear,
}: {
    onExport: () => void;
    onExportSvg: () => void;
    onExportSelectionSvg: () => void;
    onTemplates: () => void;
    onImport: () => void;
    onSave: () => void;
    onSaveSelection: () => void;
    canSaveSelection: boolean;
    ready: boolean;
    onClearBoard: () => void;
    onShowShortcuts: () => void;
    onSignOut: () => void;
    canClear: boolean;
}) {
    const triggerRef = useRef<HTMLButtonElement>(null);
    const pendingDialog = useRef<(() => void) | null>(null);
    return (
        <DropdownMenu>
            <Tooltip>
                <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                        <button
                            ref={triggerRef}
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
                className="panel max-h-[calc(100dvh-5rem)] w-56 overflow-y-auto rounded-xl border-ink-700 bg-ink-850 p-1.5 text-chalk-100"
                onCloseAutoFocus={(event) => {
                    const openDialog = pendingDialog.current;
                    if (!openDialog) return;
                    event.preventDefault();
                    pendingDialog.current = null;
                    triggerRef.current?.focus();
                    openDialog();
                }}
            >
                <DropdownMenuItem asChild className={itemClass}>
                    <Link href="/room">
                        <ArrowLeft />
                        Back to your boards
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1.5 bg-ink-700" />
                <DropdownMenuItem onSelect={() => { pendingDialog.current = onTemplates; }} disabled={!ready} className={itemClass}>
                    <LayoutTemplate /> Browse templates
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={onImport} disabled={!ready} className={itemClass}>
                    <FolderOpen /> Import board file
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={onSave} disabled={!ready || !canClear} className={itemClass}>
                    <Save /> Save board file
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={onSaveSelection} disabled={!ready || !canSaveSelection} className={itemClass}>
                    <Save /> Save selection as file
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={onExport} disabled={!canClear} className={itemClass}>
                    <Download />
                    Export as PNG
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={onExportSvg} disabled={!ready || !canClear} className={itemClass}>
                    <Download /> Export board as SVG
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={onExportSelectionSvg} disabled={!ready || !canSaveSelection} className={itemClass}>
                    <Download /> Export selection as SVG
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => { pendingDialog.current = onShowShortcuts; }} className={itemClass}>
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
