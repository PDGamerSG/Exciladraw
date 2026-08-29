"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Share2 } from "lucide-react";
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
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const boardRef = useRef<Board | null>(null);

    const [selectedTool, setSelectedTool] = useState<Tool>("select");
    const [zoom, setZoom] = useState(1);
    const [selection, setSelection] = useState<Shape[]>([]);
    const [history, setHistory] = useState({ canUndo: false, canRedo: false });
    const [peers, setPeers] = useState<Peer[]>([]);
    const [textEdit, setTextEdit] = useState<TextEditRequest | null>(null);
    const [style, setStyle] = useState<PanelState>({ ...DEFAULT_STYLE });
    const [shareOpen, setShareOpen] = useState(false);
    const [shortcutsOpen, setShortcutsOpen] = useState(false);
    const [hasShapes, setHasShapes] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const board = new Board(canvas, roomId, socket, {
            onCameraChange: (camera) => setZoom(camera.zoom),
            onSelectionChange: setSelection,
            onHistoryChange: setHistory,
            onPeersChange: setPeers,
            onTextEdit: setTextEdit,
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

    // the undo stack having anything in it is a good enough proxy for "this
    // board has content", without the engine having to publish a shape count
    useEffect(() => {
        if (history.canUndo) setHasShapes(true);
    }, [history.canUndo]);

    const updateStyle = useCallback((patch: Partial<PanelState>) => {
        setStyle((prev) => ({ ...prev, ...patch }));
        boardRef.current?.setStyle(patch);
    }, []);

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement | null;
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

    function signOut() {
        clearToken();
        router.push("/signin");
    }

    const showStylePanel = TOOLS_WITH_STYLE.includes(selectedTool) || selection.length > 0;

    return (
        <TooltipProvider delayDuration={400}>
            <div className="dark relative h-screen w-screen overflow-hidden bg-board">
                <canvas
                    ref={canvasRef}
                    aria-label={roomName ? `Drawing board: ${roomName}` : "Drawing board"}
                    className="block touch-none"
                    style={{ cursor: CURSOR_FOR_TOOL[selectedTool] ?? "crosshair" }}
                />

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
                        onClearBoard={() => boardRef.current?.clearBoard()}
                        onShowShortcuts={() => setShortcutsOpen(true)}
                        onSignOut={signOut}
                        canClear={hasShapes}
                    />

                    <div className="absolute left-1/2 -translate-x-1/2">
                        <Toolbar selectedTool={selectedTool} setSelectedTool={setSelectedTool} />
                    </div>

                    <div className="flex items-center gap-2">
                        <Presence peers={peers} />
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    type="button"
                                    onClick={() => setShareOpen(true)}
                                    className="pointer-events-auto inline-flex h-9 items-center gap-2 rounded-xl bg-amber-400 px-3.5 text-[13px] font-medium text-ink-950 shadow-[0_1px_12px_-2px_var(--amber-400)] transition-colors duration-150 hover:bg-amber-300"
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
                    <div className="pointer-events-none fixed left-3 top-16 max-h-[calc(100vh-9rem)] overflow-y-auto sm:left-4 sm:top-[4.25rem]">
                        <StylePanel
                            state={style}
                            setState={updateStyle}
                            editingCount={selection.length}
                        />
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
            </div>
        </TooltipProvider>
    );
}

export { MAX_ZOOM, MIN_ZOOM };
