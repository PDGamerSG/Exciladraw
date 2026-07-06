"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Game } from "@/draw/Game";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toolbar } from "./canvas/Toolbar";
import { MainMenu } from "./canvas/MainMenu";
import { PanelState } from "./canvas/PropertiesPanel";

export type Tool =
    | "select"
    | "rect"
    | "diamond"
    | "ellipse"
    | "arrow"
    | "line"
    | "pencil";

const KEY_TO_TOOL: Record<string, Tool> = {
    v: "select", "1": "select",
    r: "rect", "2": "rect",
    d: "diamond", "3": "diamond",
    o: "ellipse", "4": "ellipse",
    a: "arrow", "5": "arrow",
    l: "line", "6": "line",
    p: "pencil", "7": "pencil"
};

const CURSOR_FOR_TOOL: Record<string, string> = {
    select: "default"
};

export function Canvas({
    roomId,
    socket
}: {
    roomId: string;
    socket: WebSocket;
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [game, setGame] = useState<Game>();
    const [selectedTool, setSelectedTool] = useState<Tool>("select");
    const [dimensions, setDimensions] = useState({
        width: window.innerWidth,
        height: window.innerHeight
    });
    const [panelState, setPanelState] = useState<PanelState>({
        strokeColor: "#d3d3d3",
        fillColor: "transparent",
        strokeWidth: 1,
        strokeStyle: "solid",
        edges: "sharp",
        opacity: 100
    });

    const updatePanelState = useCallback((patch: Partial<PanelState>) => {
        setPanelState((prev) => ({ ...prev, ...patch }));
    }, []);

    useEffect(() => {
        game?.setTool(selectedTool);
    }, [selectedTool, game]);

    useEffect(() => {
        game?.setStyle(panelState);
    }, [panelState, game]);

    useEffect(() => {
        if (canvasRef.current) {
            const g = new Game(canvasRef.current, roomId, socket);
            setGame(g);
            return () => {
                g.destroy();
            };
        }
    }, [canvasRef]);

    useEffect(() => {
        const onResize = () => {
            setDimensions({ width: window.innerWidth, height: window.innerHeight });
            requestAnimationFrame(() => game?.resize());
        };
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, [game]);

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey || e.altKey) return;
            const target = e.target as HTMLElement;
            if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;
            const tool = KEY_TO_TOOL[e.key.toLowerCase()];
            if (tool) setSelectedTool(tool);
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, []);

    return (
        <TooltipProvider delayDuration={300}>
            <div className="dark relative h-screen w-screen overflow-hidden bg-[#121212]">
                <canvas
                    ref={canvasRef}
                    width={dimensions.width}
                    height={dimensions.height}
                    style={{ cursor: CURSOR_FOR_TOOL[selectedTool] ?? "crosshair" }}
                />

                {/* Top bar */}
                <div className="pointer-events-none fixed inset-x-4 top-4 flex items-start justify-between">
                    <MainMenu panelState={panelState} setPanelState={updatePanelState} />
                    <Toolbar
                        selectedTool={selectedTool}
                        setSelectedTool={setSelectedTool}
                    />
                    {/* spacer to keep the toolbar centered */}
                    <div className="w-9" />
                </div>
            </div>
        </TooltipProvider>
    );
}
