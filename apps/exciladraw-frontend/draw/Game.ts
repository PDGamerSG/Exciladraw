import { Tool } from "@/components/Canvas";
import { getExistingShapes } from "./http";

export type ShapeStyle = {
    strokeColor: string;
    fillColor: string;
    strokeWidth: number;
    strokeStyle: "solid" | "dashed" | "dotted";
    edges: "sharp" | "round";
    opacity: number;
};

const DEFAULT_STYLE: ShapeStyle = {
    strokeColor: "#d3d3d3",
    fillColor: "transparent",
    strokeWidth: 1,
    strokeStyle: "solid",
    edges: "sharp",
    opacity: 100
};

type Shape = ({
    type: "rect";
    x: number;
    y: number;
    width: number;
    height: number;
} | {
    type: "diamond";
    x: number;
    y: number;
    width: number;
    height: number;
} | {
    type: "circle";
    centerX: number;
    centerY: number;
    radiusX: number;
    radiusY: number;
} | {
    type: "line";
    startX: number;
    startY: number;
    endX: number;
    endY: number;
} | {
    type: "arrow";
    startX: number;
    startY: number;
    endX: number;
    endY: number;
} | {
    type: "pencil";
    points: { x: number; y: number }[];
}) & { style?: ShapeStyle };

export class Game {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private existingShapes: Shape[];
    private roomId: string;
    private clicked: boolean;
    private startX = 0;
    private startY = 0;
    private currentPoints: { x: number; y: number }[] = [];
    private selectedTool: Tool = "select";
    private style: ShapeStyle = { ...DEFAULT_STYLE };

    socket: WebSocket;

    constructor(canvas: HTMLCanvasElement, roomId: string, socket: WebSocket) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d")!;
        this.existingShapes = [];
        this.roomId = roomId;
        this.socket = socket;
        this.clicked = false;
        this.init();
        this.initSocketHandlers();
        this.initMouseHandlers();
    }

    destroy() {
        this.canvas.removeEventListener("mousedown", this.mouseDownHandler);
        this.canvas.removeEventListener("mouseup", this.mouseUpHandler);
        this.canvas.removeEventListener("mousemove", this.mouseMoveHandler);
    }

    setTool(tool: Tool) {
        this.selectedTool = tool;
    }

    setStyle(style: Partial<ShapeStyle>) {
        this.style = { ...this.style, ...style };
    }

    resize() {
        this.clearCanvas();
    }

    async init() {
        this.existingShapes = await getExistingShapes(this.roomId);
        this.clearCanvas();
    }

    initSocketHandlers() {
        this.socket.onmessage = (event) => {
            const message = JSON.parse(event.data);

            if (message.type == "chat") {
                const parsedShape = JSON.parse(message.message);
                this.existingShapes.push(parsedShape.shape);
                this.clearCanvas();
            }
        };
    }

    private applyStyle(style: ShapeStyle) {
        this.ctx.strokeStyle = style.strokeColor;
        this.ctx.lineWidth = style.strokeWidth;
        this.ctx.lineCap = "round";
        this.ctx.lineJoin = "round";
        this.ctx.globalAlpha = style.opacity / 100;
        if (style.strokeStyle === "dashed") {
            this.ctx.setLineDash([8, 8]);
        } else if (style.strokeStyle === "dotted") {
            this.ctx.setLineDash([1.5, 6]);
        } else {
            this.ctx.setLineDash([]);
        }
    }

    private fillIfNeeded(style: ShapeStyle) {
        if (style.fillColor && style.fillColor !== "transparent") {
            this.ctx.fillStyle = style.fillColor;
            this.ctx.fill();
        }
    }

    private drawShape(shape: Shape) {
        const style = { ...DEFAULT_STYLE, ...(shape.style ?? {}) };
        this.applyStyle(style);

        if (shape.type === "rect") {
            this.ctx.beginPath();
            if (style.edges === "round") {
                const r = Math.min(32, Math.abs(shape.width) / 4, Math.abs(shape.height) / 4);
                this.ctx.roundRect(shape.x, shape.y, shape.width, shape.height, r);
            } else {
                this.ctx.rect(shape.x, shape.y, shape.width, shape.height);
            }
            this.fillIfNeeded(style);
            this.ctx.stroke();
        } else if (shape.type === "diamond") {
            const { x, y, width, height } = shape;
            this.ctx.beginPath();
            this.ctx.moveTo(x + width / 2, y);
            this.ctx.lineTo(x + width, y + height / 2);
            this.ctx.lineTo(x + width / 2, y + height);
            this.ctx.lineTo(x, y + height / 2);
            this.ctx.closePath();
            this.fillIfNeeded(style);
            this.ctx.stroke();
        } else if (shape.type === "circle") {
            this.ctx.beginPath();
            this.ctx.ellipse(
                shape.centerX,
                shape.centerY,
                Math.abs(shape.radiusX ?? (shape as any).radius ?? 0),
                Math.abs(shape.radiusY ?? (shape as any).radius ?? 0),
                0, 0, Math.PI * 2
            );
            this.fillIfNeeded(style);
            this.ctx.stroke();
        } else if (shape.type === "line") {
            this.ctx.beginPath();
            this.ctx.moveTo(shape.startX, shape.startY);
            this.ctx.lineTo(shape.endX, shape.endY);
            this.ctx.stroke();
        } else if (shape.type === "arrow") {
            this.ctx.beginPath();
            this.ctx.moveTo(shape.startX, shape.startY);
            this.ctx.lineTo(shape.endX, shape.endY);
            this.ctx.stroke();
            // arrow head
            const angle = Math.atan2(shape.endY - shape.startY, shape.endX - shape.startX);
            const headLength = 12 + style.strokeWidth * 2;
            this.ctx.beginPath();
            this.ctx.moveTo(shape.endX, shape.endY);
            this.ctx.lineTo(
                shape.endX - headLength * Math.cos(angle - Math.PI / 6),
                shape.endY - headLength * Math.sin(angle - Math.PI / 6)
            );
            this.ctx.moveTo(shape.endX, shape.endY);
            this.ctx.lineTo(
                shape.endX - headLength * Math.cos(angle + Math.PI / 6),
                shape.endY - headLength * Math.sin(angle + Math.PI / 6)
            );
            this.ctx.stroke();
        } else if (shape.type === "pencil") {
            const points = shape.points ?? [];
            // older messages stored a single segment
            const legacy = shape as any;
            if (!points.length && legacy.startX !== undefined) {
                points.push({ x: legacy.startX, y: legacy.startY }, { x: legacy.endX, y: legacy.endY });
            }
            if (points.length < 2) return;
            this.ctx.beginPath();
            this.ctx.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) {
                this.ctx.lineTo(points[i].x, points[i].y);
            }
            this.ctx.stroke();
        }
        this.ctx.globalAlpha = 1;
    }

    private drawGrid() {
        const spacing = 20;
        this.ctx.strokeStyle = "rgba(255,255,255,0.05)";
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        for (let x = 0.5; x <= this.canvas.width; x += spacing) {
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
        }
        for (let y = 0.5; y <= this.canvas.height; y += spacing) {
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
        }
        this.ctx.stroke();
    }

    clearCanvas() {
        this.ctx.setLineDash([]);
        this.ctx.globalAlpha = 1;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = "#121212";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawGrid();
        this.existingShapes.forEach((shape) => {
            if (shape) this.drawShape(shape);
        });
    }

    private isDrawingTool(tool: Tool) {
        return ["rect", "diamond", "ellipse", "line", "arrow", "pencil"].includes(tool);
    }

    private buildShape(endX: number, endY: number): Shape | null {
        const width = endX - this.startX;
        const height = endY - this.startY;
        const style = { ...this.style };

        switch (this.selectedTool) {
            case "rect":
                return { type: "rect", x: this.startX, y: this.startY, width, height, style };
            case "diamond":
                return { type: "diamond", x: this.startX, y: this.startY, width, height, style };
            case "ellipse":
                return {
                    type: "circle",
                    centerX: this.startX + width / 2,
                    centerY: this.startY + height / 2,
                    radiusX: Math.abs(width / 2),
                    radiusY: Math.abs(height / 2),
                    style
                };
            case "line":
                return { type: "line", startX: this.startX, startY: this.startY, endX, endY, style };
            case "arrow":
                return { type: "arrow", startX: this.startX, startY: this.startY, endX, endY, style };
            case "pencil":
                if (this.currentPoints.length < 2) return null;
                return { type: "pencil", points: [...this.currentPoints], style };
            default:
                return null;
        }
    }

    mouseDownHandler = (e: MouseEvent) => {
        if (!this.isDrawingTool(this.selectedTool)) return;
        this.clicked = true;
        this.startX = e.clientX;
        this.startY = e.clientY;
        if (this.selectedTool === "pencil") {
            this.currentPoints = [{ x: e.clientX, y: e.clientY }];
        }
    };

    mouseUpHandler = (e: MouseEvent) => {
        if (!this.clicked) return;
        this.clicked = false;

        const shape = this.buildShape(e.clientX, e.clientY);
        this.currentPoints = [];
        if (!shape) return;

        this.existingShapes.push(shape);
        this.clearCanvas();
        this.socket.send(JSON.stringify({
            type: "chat",
            message: JSON.stringify({ shape }),
            roomId: this.roomId
        }));
    };

    mouseMoveHandler = (e: MouseEvent) => {
        if (!this.clicked) return;

        if (this.selectedTool === "pencil") {
            this.currentPoints.push({ x: e.clientX, y: e.clientY });
        }

        const shape = this.buildShape(e.clientX, e.clientY);
        this.clearCanvas();
        if (shape) this.drawShape(shape);
    };

    initMouseHandlers() {
        this.canvas.addEventListener("mousedown", this.mouseDownHandler);
        this.canvas.addEventListener("mouseup", this.mouseUpHandler);
        this.canvas.addEventListener("mousemove", this.mouseMoveHandler);
    }
}
