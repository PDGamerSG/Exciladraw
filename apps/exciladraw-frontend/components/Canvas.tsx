"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Share2, LayoutTemplate, X } from "lucide-react";
import { Board, type Peer, type Tool, type TextEditRequest } from "@/draw/Board";
import { DEFAULT_STYLE, MAX_ZOOM, MIN_ZOOM, type Shape } from "@/draw/types";
import { clearToken } from "@/lib/api";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Toolbar } from "./canvas/Toolbar";
import { StylePanel, type PanelState } from "./canvas/StylePanel";
import { ViewControls } from "./canvas/ViewControls";
import { Presence } from "./canvas/Presence";
import { BoardMenu } from "./canvas/BoardMenu";
import { ShareDialog } from "./canvas/ShareDialog";
import { ShortcutsDialog } from "./canvas/ShortcutsDialog";
import { TextEditor } from "./canvas/TextEditor";
import { TemplateDialog } from "./canvas/TemplateDialog";
import { ArrangePanel } from "./canvas/ArrangePanel";
import { MAX_DOCUMENT_BYTES, parseDocument } from "@/draw/document";
import type { BoardTemplate } from "@/draw/templates";

import { useTheme } from "@/lib/theme";
import { ThemeControl } from "./ThemeControl";

export type { Tool };

const KEY_TO_TOOL: Record<string, Tool> = {
    v: "select", "1": "select",
    h: "hand", "2": "hand",
    r: "rect", "3": "rect",
    d: "diamond", "4": "diamond",
    o: "ellipse", "5": "ellipse",
    a: "arrow", "6": "arrow",
    l: "line", "7": "line",
    p: "pencil", "8": "pencil",
    t: "text", "9": "text",
    e: "eraser", "0": "eraser",
};

const CURSOR_FOR_TOOL: Partial<Record<Tool, string>> = {
    select: "default",
    hand: "grab",
    text: "text",
    eraser: "cell",
};

/** The panel is only useful for tools that produce something styled. */
const TOOLS_WITH_STYLE: Tool[] = ["rect", "diamond", "ellipse", "arrow", "line", "pencil", "text"];

export function Canvas({
    roomId,
    socket,
    roomName,
    inviteCode,
}: {
    roomId: string;
    socket: WebSocket;
    roomName?: string;
    inviteCode?: string;
}) {
    const router = useRouter();
    const { theme } = useTheme();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const boardRef = useRef<Board | null>(null);
    const importRef = useRef<HTMLInputElement>(null);

    const [selectedTool, setSelectedTool] = useState<Tool>("select");
    const [zoom, setZoom] = useState(1);
    const [selection, setSelection] = useState<Shape[]>([]);
    const [history, setHistory] = useState({ canUndo: false, canRedo: false });
    const [peers, setPeers] = useState<Peer[]>([]);
    const [textEdit, setTextEdit] = useState<TextEditRequest | null>(null);
    const [style, setStyle] = useState<PanelState>({ ...DEFAULT_STYLE });
    const [shareOpen, setShareOpen] = useState(false);
    const [shortcutsOpen, setShortcutsOpen] = useState(false);
    const [shapeCount, setShapeCount] = useState(0);
    const [templatesOpen, setTemplatesOpen] = useState(false);
    const [ready, setReady] = useState(false);
    const [notice, setNotice] = useState<{ message: string; error: boolean } | null>(null);
    const [importing, setImporting] = useState(false);
    const closeTemplates = useCallback(() => setTemplatesOpen(false), []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const board = new Board(canvas, roomId, socket, {
            onCameraChange: (camera) => setZoom(camera.zoom),
            onSelectionChange: setSelection,
            onHistoryChange: setHistory,
            onPeersChange: setPeers,
            onShapeCountChange: setShapeCount,
            onTextEdit: setTextEdit,
            onNotice: (message, error) => setNotice({ message, error }),
            onLoad: (error) => {
                setReady(!error);
                if (error) setNotice({ message: error, error: true });
            },
            // a shape tool is a one-shot: after drawing, you almost always want
            // to grab what you just made rather than draw a second one
            onToolFinished: () => setSelectedTool("select"),
        });
        boardRef.current = board;

        const resize = () => {
            board.resize(window.innerWidth, window.innerHeight, window.devicePixelRatio || 1);
        };
        resize();
        window.addEventListener("resize", resize);

        return () => {
            window.removeEventListener("resize", resize);
            board.destroy();
            boardRef.current = null;
        };
    }, [roomId, socket]);

    useEffect(() => {
        boardRef.current?.setTool(selectedTool);
    }, [selectedTool]);

    useEffect(() => {
        boardRef.current?.setTheme(theme);
    }, [theme, roomId, socket]);

    const updateStyle = useCallback((patch: Partial<PanelState>) => {
        setStyle((prev) => ({ ...prev, ...patch }));
        boardRef.current?.setStyle(patch);
    }, []);

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement | null;
            if (target?.closest('[role="dialog"], [role="menu"], button, select, a')) return;
            if (
                target &&
                (target.tagName === "INPUT" ||
                    target.tagName === "TEXTAREA" ||
                    target.isContentEditable)
            ) {
                return;
            }

            const board = boardRef.current;
            if (!board) return;

            if (e.ctrlKey || e.metaKey) {
                if (e.key === "=" || e.key === "+") {
                    e.preventDefault();
                    board.setZoom(board.getCamera().zoom * 1.2);
                } else if (e.key === "-") {
                    e.preventDefault();
                    board.setZoom(board.getCamera().zoom / 1.2);
                } else if (e.key === "0") {
                    e.preventDefault();
                    board.setZoom(1);
                }
                return;
            }
            if (e.altKey) return;

            if (e.shiftKey && e.key === "!") {
                e.preventDefault();
                board.zoomToFit();
                return;
            }
            if (e.key === "?") {
                e.preventDefault();
                setShortcutsOpen(true);
                return;
            }
            if (e.shiftKey) return;

            const tool = KEY_TO_TOOL[e.key.toLowerCase()];
            if (tool) setSelectedTool(tool);
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, []);

    async function exportPng() {
        const blob = await boardRef.current?.toPng();
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${(roomName || `board-${roomId}`).replace(/[^\w-]+/g, "-")}.png`;
        link.click();
        URL.revokeObjectURL(url);
    }

    function saveBoard(selectionOnly = false) {
        try {
            const text = boardRef.current?.toDocument(selectionOnly);
            if (!text) return;
            const blob = new Blob([text], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `${(roomName || `board-${roomId}`).replace(/[^\w-]+/g, "-")}${selectionOnly ? "-selection" : ""}.exciladraw.json`;
            link.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (error) {
            setNotice({ message: error instanceof Error ? error.message : "Could not save this board.", error: true });
        }
    }

    function exportSvg(selectionOnly = false) {
        try {
            const svg = boardRef.current?.toSvg(selectionOnly);
            if (!svg) return;
            const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
            const link = document.createElement("a");
            link.href = url;
            link.download = `${(roomName || `board-${roomId}`).replace(/[^\w-]+/g, "-")}${selectionOnly ? "-selection" : ""}.svg`;
            link.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (error) {
            setNotice({ message: error instanceof Error ? error.message : "Could not export this SVG.", error: true });
        }
    }

    async function importBoard(file: File) {
        const board = boardRef.current;
        if (!board) return;
        setImporting(true);
        try {
            if (file.size > MAX_DOCUMENT_BYTES) throw new Error("This file is too large. Choose a board file under 5 MB.");
            const shapes = parseDocument(await file.text());
            if (boardRef.current !== board) return;
            board.insertShapes(shapes);
            setSelectedTool("select");
            setNotice({ message: `Inserted ${shapes.length} shapes. Your existing work is unchanged. Undo removes this insert.`, error: false });
        } catch (error) {
            setNotice({ message: error instanceof Error ? error.message : "Could not read this file.", error: true });
        } finally {
            setImporting(false);
        }
    }

    function insertTemplate(template: BoardTemplate) {
        try {
            boardRef.current?.insertShapes(template.shapes);
            setSelectedTool("select");
            setTemplatesOpen(false);
            setNotice({ message: `${template.name} inserted. Double-click a label to edit it. Undo removes this insert.`, error: false });
        } catch (error) {
            setNotice({ message: error instanceof Error ? error.message : "Could not insert this template.", error: true });
            setTemplatesOpen(false);
        }
    }

    function signOut() {
        clearToken();
        router.push("/signin");
    }

    const showStylePanel = TOOLS_WITH_STYLE.includes(selectedTool) || selection.length > 0;

    return (
        <TooltipProvider delayDuration={400}>
            <div className="relative h-screen w-screen overflow-hidden bg-board">
                <canvas
                    ref={canvasRef}
                    aria-label={roomName ? `Drawing board: ${roomName}` : "Drawing board"}
                    className="block touch-none"
                    style={{ cursor: CURSOR_FOR_TOOL[selectedTool] ?? "crosshair" }}
                />
                <input ref={importRef} type="file" accept=".json,.exciladraw" className="hidden" aria-label="Import board file"
                    onChange={(event) => {
                        const file = event.target.files?.[0];
                        event.target.value = "";
                        if (file) void importBoard(file);
                    }} />

                {ready && shapeCount === 0 && selectedTool === "select" && !textEdit && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-6">
                        <div className="max-w-sm text-center">
                            <h1 className="font-display text-xl font-medium text-chalk-100">A little room to think.</h1>
                            <p className="mt-2 text-sm leading-relaxed text-chalk-300">Pick a tool above, or give your board a head start with a template.</p>
                            <button type="button" onClick={() => setTemplatesOpen(true)}
                                className="pointer-events-auto mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-hover">
                                <LayoutTemplate className="h-4 w-4" /> Browse templates
                            </button>
                            <p className="mt-3 text-xs text-chalk-500">Flowcharts, project boards, architecture & workshops</p>
                        </div>
                    </div>
                )}

                {textEdit && (
                    <TextEditor
                        request={textEdit}
                        onCommit={(value) => {
                            const board = boardRef.current;
                            if (board) {
                                board.commitText(
                                    textEdit.shapeId,
                                    value,
                                    board.worldAt({ x: textEdit.left, y: textEdit.top }),
                                    board.fontSizeFor(textEdit.fontSize)
                                );
                            }
                            setTextEdit(null);
                            setSelectedTool("select");
                        }}
                        onCancel={() => {
                            setTextEdit(null);
                            setSelectedTool("select");
                        }}
                    />
                )}

                {/* Top row: board controls left, tools centred, the room right. */}
                <div className="pointer-events-none fixed inset-x-3 top-3 flex items-start justify-between gap-3 sm:inset-x-4 sm:top-4">
                    <BoardMenu
                        onExport={exportPng}
                        onExportSvg={() => exportSvg()}
                        onExportSelectionSvg={() => exportSvg(true)}
                        onTemplates={() => setTemplatesOpen(true)}
                        onImport={() => importRef.current?.click()}
                        onSave={() => saveBoard()}
                        onSaveSelection={() => saveBoard(true)}
                        canSaveSelection={selection.length > 0}
                        ready={ready && !importing}
                        onClearBoard={() => boardRef.current?.clearBoard()}
                        onShowShortcuts={() => setShortcutsOpen(true)}
                        onSignOut={signOut}
                        canClear={shapeCount > 0}
                    />

                    <div className="absolute left-1/2 top-12 max-w-[calc(100vw-1.5rem)] -translate-x-1/2 overflow-x-auto lg:top-0 lg:max-w-none">
                        <Toolbar selectedTool={selectedTool} setSelectedTool={setSelectedTool} />
                    </div>

                    <div className="flex items-center gap-2">
                        <Presence peers={peers} />
                        <ThemeControl />
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    type="button"
                                    aria-label="Share board"
                                    onClick={() => setShareOpen(true)}
                                    className="pointer-events-auto inline-flex h-9 items-center gap-2 rounded-xl bg-primary px-3.5 text-[13px] font-medium text-primary-foreground transition-colors duration-150 hover:bg-primary-hover"
                                >
                                    <Share2 className="h-3.5 w-3.5" />
                                    <span className="hidden sm:inline">Share</span>
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">Invite people to this board</TooltipContent>
                        </Tooltip>
                    </div>
                </div>

                {/* The style panel sits under the board controls, out of the way
                    of the drawing area but always reachable. */}
                {showStylePanel && (
                    <div className="pointer-events-none fixed left-3 top-28 max-h-[calc(100dvh-12rem)] overflow-y-auto sm:left-4 lg:top-[4.25rem] sm:max-h-[calc(100dvh-9rem)]">
                        <StylePanel
                            state={style}
                            setState={updateStyle}
                            editingCount={selection.length}
                        />
                        {selection.length >= 2 && <ArrangePanel count={selection.length} onArrange={(action) => boardRef.current?.arrangeSelection(action)} />}
                    </div>
                )}

                <div className="pointer-events-none fixed bottom-3 left-3 sm:bottom-4 sm:left-4">
                    <ViewControls
                        zoom={zoom}
                        onZoomIn={() => boardRef.current?.setZoom(zoom * 1.2)}
                        onZoomOut={() => boardRef.current?.setZoom(zoom / 1.2)}
                        onZoomReset={() => boardRef.current?.setZoom(1)}
                        onZoomToFit={() => boardRef.current?.zoomToFit()}
                        onUndo={() => boardRef.current?.undo()}
                        onRedo={() => boardRef.current?.redo()}
                        canUndo={history.canUndo}
                        canRedo={history.canRedo}
                    />
                </div>

                <button
                    type="button"
                    onClick={() => setShortcutsOpen(true)}
                    className="panel fixed bottom-3 right-3 hidden h-8 items-center rounded-xl px-3 font-mono text-[11px] text-chalk-500 transition-colors duration-150 hover:text-chalk-100 sm:bottom-4 sm:right-4 sm:flex"
                >
                    ? shortcuts
                </button>

                <ShareDialog
                    open={shareOpen}
                    onClose={() => setShareOpen(false)}
                    inviteCode={inviteCode}
                    roomName={roomName}
                />
                <ShortcutsDialog open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
                <TemplateDialog open={templatesOpen} onClose={closeTemplates} onInsert={insertTemplate} />
                {(notice || importing) && (
                    <div className="panel fixed bottom-16 left-1/2 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-start gap-3 rounded-xl p-3 text-[13px] leading-relaxed text-chalk-100">
                        <p role={notice?.error ? "alert" : "status"} className="flex-1">{importing ? "Reading board file…" : notice?.message}</p>
                        {!importing && <button type="button" aria-label="Dismiss message" onClick={() => setNotice(null)} className="rounded p-1 text-chalk-300 hover:text-chalk-100"><X className="h-4 w-4" /></button>}
                    </div>
                )}
            </div>
        </TooltipProvider>
    );
}

export { MAX_ZOOM, MIN_ZOOM };
