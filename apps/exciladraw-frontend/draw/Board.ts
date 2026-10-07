import { ShapeSchema } from "@repo/common/types";
import { arrangeShapes, type Arrangement } from "./arrange";
import { prepareInsertion, serializeDocument } from "./document";
import { getExistingShapes } from "./http";
import { isClipboardField, readClipboard } from "./clipboard";
import { toSvg } from "./svg";
import { boundsIntersect, boundsOf, hitTest, shapeBounds, translateShape } from "./geometry";
import {
    BOARD_BACKGROUND,
    drawCursor,
    drawGrid,
    drawMarquee,
    drawSelection,
    drawShape,
    fontFor,
    peerColor,
    setFontFamily
} from "./render";
import {
    DEFAULT_STYLE,
    MAX_ZOOM,
    MIN_ZOOM,
    newShapeId,
    type Bounds,
    type Camera,
    type Point,
    type Shape,
    type ShapeStyle
} from "./types";

export type Tool =
    | "select"
    | "hand"
    | "rect"
    | "diamond"
    | "ellipse"
    | "arrow"
    | "line"
    | "pencil"
    | "text"
    | "eraser";

export type Peer = { userId: string; name: string };

export type TextEditRequest = {
    /** Existing shape being re-edited, or null when placing new text. */
    shapeId: string | null;
    value: string;
    /** Screen position and size, so the overlay input can sit over the caret. */
    left: number;
    top: number;
    fontSize: number;
    color: string;
};

export type BoardCallbacks = {
    onCameraChange?: (camera: Camera) => void;
    onSelectionChange?: (shapes: Shape[]) => void;
    onHistoryChange?: (state: { canUndo: boolean; canRedo: boolean }) => void;
    onPeersChange?: (peers: Peer[]) => void;
    onShapeCountChange?: (count: number) => void;
    onTextEdit?: (request: TextEditRequest | null) => void;
    onLoad?: (error?: string) => void;
    onNotice?: (message: string, error: boolean) => void;
    /** Fires when a one-shot tool has finished, so the UI can fall back to select. */
    onToolFinished?: () => void;
};

/** One reversible edit. Undo replays it backwards, redo forwards. */
type Op =
    | { type: "add"; shapes: Shape[] }
    | { type: "delete"; shapes: Shape[] }
    | { type: "update"; before: Shape[]; after: Shape[] };

const HISTORY_LIMIT = 100;
const CURSOR_INTERVAL_MS = 50;
/** Below this many pixels of movement a drag is treated as a click. */
const CLICK_SLOP = 4;

export class Board {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private roomId: string;
    private socket: WebSocket;
    private callbacks: BoardCallbacks;

    private shapes: Shape[] = [];
    private byId = new Map<string, Shape>();
    private selected = new Set<string>();

    private camera: Camera = { scrollX: 0, scrollY: 0, zoom: 1 };
    private width = 0;
    private height = 0;
    private dpr = 1;

    private tool: Tool = "select";
    private style: ShapeStyle = { ...DEFAULT_STYLE };

    private undoStack: Op[] = [];
    private redoStack: Op[] = [];

    private peers = new Map<string, Peer>();
    private cursors = new Map<string, { x: number; y: number; name: string; at: number }>();
    private lastCursorSentAt = 0;

    /** What the current pointer drag is doing, if anything. */
    private gesture:
        | { kind: "none" }
        | { kind: "draw"; start: Point; points: Point[]; preview: Shape | null }
        | { kind: "pan"; startScroll: Point; origin: Point }
        | { kind: "move"; origin: Point; last: Point; before: Shape[]; moved: boolean }
        | { kind: "marquee"; origin: Point; box: Bounds; additive: boolean }
        | { kind: "erase"; erased: Shape[] } = { kind: "none" };

    private spaceHeld = false;
    private frame: number | null = null;
    private destroyed = false;
    private loaded = false;
    private cursorSweep: ReturnType<typeof setInterval> | null = null;

    constructor(
        canvas: HTMLCanvasElement,
        roomId: string,
        socket: WebSocket,
        callbacks: BoardCallbacks = {}
    ) {
        this.canvas = canvas;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("This browser cannot render a 2d canvas");
        this.ctx = ctx;
        this.roomId = roomId;
        this.socket = socket;
        this.callbacks = callbacks;

        setFontFamily(getComputedStyle(canvas).fontFamily);
        this.attach();
        void this.loadShapes();

        // a collaborator who closes the tab mid-stroke leaves a cursor behind,
        // so anything that has stopped moving for a while is dropped
        this.cursorSweep = setInterval(() => {
            const cutoff = Date.now() - 8000;
            let changed = false;
            for (const [userId, cursor] of this.cursors) {
                if (cursor.at < cutoff) {
                    this.cursors.delete(userId);
                    changed = true;
                }
            }
            if (changed) this.requestRender();
        }, 4000);
    }

    /* ── lifecycle ─────────────────────────────────────────────────────── */

    private attach() {
        this.canvas.addEventListener("pointerdown", this.onPointerDown);
        this.canvas.addEventListener("pointermove", this.onPointerMove);
        this.canvas.addEventListener("pointerup", this.onPointerUp);
        this.canvas.addEventListener("pointercancel", this.onPointerUp);
        this.canvas.addEventListener("wheel", this.onWheel, { passive: false });
        this.canvas.addEventListener("dblclick", this.onDoubleClick);
        this.canvas.addEventListener("contextmenu", this.onContextMenu);
        window.addEventListener("keydown", this.onKeyDown);
        window.addEventListener("keyup", this.onKeyUp);
        window.addEventListener("blur", this.onWindowBlur);
        window.addEventListener("copy", this.onCopy);
        window.addEventListener("cut", this.onCut);
        window.addEventListener("paste", this.onPaste);
        this.socket.addEventListener("message", this.onSocketMessage);
    }

    destroy() {
        this.destroyed = true;
        this.canvas.removeEventListener("pointerdown", this.onPointerDown);
        this.canvas.removeEventListener("pointermove", this.onPointerMove);
        this.canvas.removeEventListener("pointerup", this.onPointerUp);
        this.canvas.removeEventListener("pointercancel", this.onPointerUp);
        this.canvas.removeEventListener("wheel", this.onWheel);
        this.canvas.removeEventListener("dblclick", this.onDoubleClick);
        this.canvas.removeEventListener("contextmenu", this.onContextMenu);
        window.removeEventListener("keydown", this.onKeyDown);
        window.removeEventListener("keyup", this.onKeyUp);
        window.removeEventListener("blur", this.onWindowBlur);
        window.removeEventListener("copy", this.onCopy);
        window.removeEventListener("cut", this.onCut);
        window.removeEventListener("paste", this.onPaste);
        this.socket.removeEventListener("message", this.onSocketMessage);
        if (this.frame !== null) cancelAnimationFrame(this.frame);
        if (this.cursorSweep !== null) clearInterval(this.cursorSweep);
    }

    private async loadShapes() {
        try {
            const shapes = await getExistingShapes(this.roomId);
            if (this.destroyed) return;
            this.setShapes(shapes);
            // an existing board opens showing its contents rather than an
            // empty patch of canvas wherever the origin happens to be
            if (shapes.length) this.zoomToFit({ animate: false });
            this.loaded = true;
            this.callbacks.onLoad?.();
        } catch (e) {
            console.error("could not load the existing shapes for this room", e);
            if (!this.destroyed) this.callbacks.onLoad?.("Could not load this board. Reload before inserting or saving a file.");
        }
        this.requestRender();
    }

    private setShapes(shapes: Shape[]) {
        this.shapes = shapes;
        this.byId = new Map(shapes.map((s) => [s.id, s]));
        this.emitShapeCount();
    }

    /* ── public API ────────────────────────────────────────────────────── */

    setTool(tool: Tool) {
        if (this.tool === tool) return;
        this.tool = tool;
        if (tool !== "select") this.clearSelection();
        this.requestRender();
    }

    setStyle(style: Partial<ShapeStyle>) {
        this.style = { ...this.style, ...style };
        // restyling with a selection active edits those shapes, which is what
        // reaching for the colour picker while something is selected means
        if (this.selected.size) {
            const before: Shape[] = [];
            const after: Shape[] = [];
            for (const id of this.selected) {
                const shape = this.byId.get(id);
                if (!shape) continue;
                before.push(shape);
                after.push({ ...shape, style: { ...DEFAULT_STYLE, ...shape.style, ...style } });
            }
            if (after.length) {
                this.applyUpdate(before, after);
                this.pushOp({ type: "update", before, after });
                this.send({ type: "update", roomId: this.roomId, shapes: after });
            }
        }
    }

    getCamera(): Camera {
        return { ...this.camera };
    }

    resize(width: number, height: number, dpr: number) {
        this.width = width;
        this.height = height;
        this.dpr = dpr;
        // the backing store is sized in device pixels and scaled back down in
        // the transform, which is what keeps strokes crisp on retina screens
        this.canvas.width = Math.round(width * dpr);
        this.canvas.height = Math.round(height * dpr);
        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;
        this.requestRender();
    }

    setZoom(zoom: number, anchor?: Point) {
        const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
        const at = anchor ?? { x: this.width / 2, y: this.height / 2 };
        // keep the point under the anchor fixed while the scale changes
        const world = this.toWorld(at);
        this.camera.zoom = next;
        this.camera.scrollX = at.x - world.x * next;
        this.camera.scrollY = at.y - world.y * next;
        this.emitCamera();
        this.requestRender();
    }

    zoomToFit({ animate = true }: { animate?: boolean } = {}) {
        const target = this.selected.size ? this.selectedShapes() : this.shapes;
        const bounds = boundsOf(target);
        if (!bounds || !this.width || !this.height) {
            this.resetView();
            return;
        }
        const padding = 96;
        const width = Math.max(bounds.maxX - bounds.minX, 1);
        const height = Math.max(bounds.maxY - bounds.minY, 1);
        const zoom = Math.min(
            MAX_ZOOM,
            Math.max(
                MIN_ZOOM,
                Math.min((this.width - padding) / width, (this.height - padding) / height, 1)
            )
        );
        this.camera = {
            zoom,
            scrollX: this.width / 2 - ((bounds.minX + bounds.maxX) / 2) * zoom,
            scrollY: this.height / 2 - ((bounds.minY + bounds.maxY) / 2) * zoom
        };
        void animate;
        this.emitCamera();
        this.requestRender();
    }

    resetView() {
        this.camera = { scrollX: 0, scrollY: 0, zoom: 1 };
        this.emitCamera();
        this.requestRender();
    }

    selectAll() {
        this.selected = new Set(this.shapes.map((s) => s.id));
        this.emitSelection();
        this.requestRender();
    }

    clearSelection() {
        if (!this.selected.size) return;
        this.selected.clear();
        this.emitSelection();
        this.requestRender();
    }

    deleteSelection() {
        const shapes = this.selectedShapes();
        if (!shapes.length) return;
        this.removeShapes(shapes.map((s) => s.id));
        this.pushOp({ type: "delete", shapes });
        this.send({ type: "erase", roomId: this.roomId, shapeIds: shapes.map((s) => s.id) });
        this.selected.clear();
        this.emitSelection();
        this.requestRender();
    }

    duplicateSelection() {
        const shapes = this.selectedShapes();
        if (!shapes.length) return;
        const copies = shapes.map((shape) => ({
            ...translateShape(shape, 16, 16),
            id: newShapeId()
        }));
        this.addShapes(copies);
        this.pushOp({ type: "add", shapes: copies });
        for (const shape of copies) {
            this.send({ type: "draw", roomId: this.roomId, shape });
        }
        this.selected = new Set(copies.map((s) => s.id));
        this.emitSelection();
        this.requestRender();
    }

    /** One insert is one undo step, even for a complete diagram. */
    insertShapes(shapes: Shape[]) {
        if (!this.loaded) throw new Error("Wait for the board to finish loading.");
        if (this.socket.readyState !== WebSocket.OPEN) throw new Error("Reconnect before inserting a diagram.");
        const copies = prepareInsertion(shapes, this.toWorld({ x: this.width / 2, y: this.height / 2 }));
        if (!copies.length) return;
        this.setTool("select");
        this.addShapes(copies);
        this.pushOp({ type: "add", shapes: copies });
        for (const shape of copies) this.send({ type: "draw", roomId: this.roomId, shape });
        this.selected = new Set(copies.map((shape) => shape.id));
        this.emitSelection();
        this.zoomToFit();
    }

    toDocument(selectionOnly = false) {
        if (!this.loaded) throw new Error("Wait for the board to finish loading.");
        return serializeDocument(selectionOnly ? this.selectedShapes() : this.shapes);
    }

    toSvg(selectionOnly = false) {
        if (!this.loaded) throw new Error("Wait for the board to finish loading.");
        return toSvg(selectionOnly ? this.selectedShapes() : this.shapes, {
            fontFamily: getComputedStyle(this.canvas).fontFamily,
            measureText: (text, size) => this.measureText(text, size),
        });
    }

    private copyToClipboard(event: ClipboardEvent, cut: boolean) {
        if (isClipboardField(event.target) || !event.clipboardData || !this.selected.size) return;
        // A selected label in the surrounding UI should retain native copy.
        if (window.getSelection?.()?.toString()) return;
        event.preventDefault();
        try {
            if (cut && this.socket.readyState !== WebSocket.OPEN) throw new Error("Reconnect before cutting shapes.");
            const text = this.toDocument(true);
            event.clipboardData.setData("text/plain", text);
            if (cut) this.deleteSelection();
            this.callbacks.onNotice?.(cut ? "Selection cut. Paste it into any board, or undo to restore it." : "Selection copied. Paste it into any board.", false);
        } catch (error) {
            this.callbacks.onNotice?.(error instanceof Error ? error.message : "Could not copy the selection.", true);
        }
    }

    private onCopy = (event: ClipboardEvent) => this.copyToClipboard(event, false);
    private onCut = (event: ClipboardEvent) => this.copyToClipboard(event, true);
    private onPaste = (event: ClipboardEvent) => {
        if (isClipboardField(event.target) || !event.clipboardData || event.clipboardData.files.length) return;
        const text = event.clipboardData.getData("text/plain");
        if (!text.trim()) return;
        event.preventDefault();
        try {
            const shapes = readClipboard(text);
            this.insertShapes(shapes);
            this.callbacks.onToolFinished?.();
            this.callbacks.onNotice?.(`Pasted ${shapes.length} ${shapes.length === 1 ? "shape" : "shapes"}. Undo removes this paste.`, false);
        } catch (error) {
            this.callbacks.onNotice?.(error instanceof Error ? error.message : "Could not paste this content.", true);
        }
    };

    arrangeSelection(action: Arrangement) {
        const before = this.selectedShapes();
        const after = arrangeShapes(before, action);
        if (after === before || after.every((shape, index) => JSON.stringify(shape) === JSON.stringify(before[index]))) return;
        this.applyUpdate(before, after);
        this.pushOp({ type: "update", before, after });
        this.send({ type: "update", roomId: this.roomId, shapes: after });
        this.emitSelection();
        this.requestRender();
    }

    /** Clears the whole board. Only offered to the room's owner in the UI. */
    clearBoard() {
        if (!this.shapes.length) return;
        const shapes = this.shapes;
        this.pushOp({ type: "delete", shapes });
        this.send({ type: "erase", roomId: this.roomId, shapeIds: shapes.map((s) => s.id) });
        this.setShapes([]);
        this.selected.clear();
        this.emitSelection();
        this.requestRender();
    }

    undo() {
        const op = this.undoStack.pop();
        if (!op) return;
        this.redoStack.push(op);
        this.applyOp(op, true);
        this.emitHistory();
    }

    redo() {
        const op = this.redoStack.pop();
        if (!op) return;
        this.undoStack.push(op);
        this.applyOp(op, false);
        this.emitHistory();
    }

    /** Commits the text the overlay input collected, or discards it if empty. */
    commitText(shapeId: string | null, value: string, world: Point, fontSize: number) {
        const text = value.trim();
        const existing = shapeId ? this.byId.get(shapeId) : undefined;

        if (!text) {
            if (existing) {
                this.removeShapes([existing.id]);
                this.pushOp({ type: "delete", shapes: [existing] });
                this.send({ type: "erase", roomId: this.roomId, shapeIds: [existing.id] });
                this.requestRender();
            }
            return;
        }

        if (existing && existing.type === "text") {
            if (existing.text === value) return;
            const after: Shape = { ...existing, text: value };
            this.applyUpdate([existing], [after]);
            this.pushOp({ type: "update", before: [existing], after: [after] });
            this.send({ type: "update", roomId: this.roomId, shapes: [after] });
            this.requestRender();
            return;
        }

        const shape: Shape = {
            type: "text",
            id: newShapeId(),
            x: world.x,
            y: world.y,
            text: value,
            fontSize,
            style: { ...this.style }
        };
        this.addShapes([shape]);
        this.pushOp({ type: "add", shapes: [shape] });
        this.send({ type: "draw", roomId: this.roomId, shape });
        this.requestRender();
    }

    /** Renders the board to a PNG blob, cropped to its contents. */
    async toPng(scale = 2): Promise<Blob | null> {
        const bounds = boundsOf(this.shapes);
        if (!bounds) return null;
        const padding = 32;
        const width = Math.ceil((bounds.maxX - bounds.minX + padding * 2) * scale);
        const height = Math.ceil((bounds.maxY - bounds.minY + padding * 2) * scale);
        if (width <= 0 || height <= 0) return null;

        const target = document.createElement("canvas");
        target.width = Math.min(width, 8192);
        target.height = Math.min(height, 8192);
        const ctx = target.getContext("2d");
        if (!ctx) return null;

        ctx.fillStyle = BOARD_BACKGROUND;
        ctx.fillRect(0, 0, target.width, target.height);
        ctx.setTransform(scale, 0, 0, scale, -(bounds.minX - padding) * scale, -(bounds.minY - padding) * scale);
        for (const shape of this.shapes) drawShape(ctx, shape);

        return new Promise((resolve) => target.toBlob(resolve, "image/png"));
    }

    /* ── coordinates ───────────────────────────────────────────────────── */

    private toWorld(screen: Point): Point {
        return {
            x: (screen.x - this.camera.scrollX) / this.camera.zoom,
            y: (screen.y - this.camera.scrollY) / this.camera.zoom
        };
    }

    toScreen(world: Point): Point {
        return {
            x: world.x * this.camera.zoom + this.camera.scrollX,
            y: world.y * this.camera.zoom + this.camera.scrollY
        };
    }

    private eventPoint(e: PointerEvent | MouseEvent | WheelEvent): Point {
        // the canvas is not always flush with the viewport origin, so the
        // element's own box is what client coordinates are measured against
        const rect = this.canvas.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    private viewportBounds(): Bounds {
        const topLeft = this.toWorld({ x: 0, y: 0 });
        const bottomRight = this.toWorld({ x: this.width, y: this.height });
        return {
            minX: topLeft.x,
            minY: topLeft.y,
            maxX: bottomRight.x,
            maxY: bottomRight.y
        };
    }

    /* ── rendering ─────────────────────────────────────────────────────── */

    requestRender() {
        if (this.frame !== null || this.destroyed) return;
        // coalescing into one animation frame keeps a fast drag from queuing
        // a full repaint per pointer sample
        this.frame = requestAnimationFrame(() => {
            this.frame = null;
            this.render();
        });
    }

    private render() {
        if (!this.width || !this.height) return;
        const { ctx, camera } = this;
        const scale = this.dpr * camera.zoom;

        ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
        ctx.globalAlpha = 1;
        ctx.setLineDash([]);
        ctx.fillStyle = BOARD_BACKGROUND;
        ctx.fillRect(0, 0, this.width, this.height);

        ctx.setTransform(scale, 0, 0, scale, camera.scrollX * this.dpr, camera.scrollY * this.dpr);
        const viewport = this.viewportBounds();
        drawGrid(ctx, viewport, camera.zoom);

        for (const shape of this.shapes) {
            // shapes far outside the viewport still cost a path to rasterise,
            // so a cheap bounds test keeps a large board scrolling smoothly
            if (!boundsIntersect(shapeBounds(shape), viewport)) continue;
            drawShape(ctx, shape);
        }

        if (this.gesture.kind === "draw" && this.gesture.preview) {
            drawShape(ctx, this.gesture.preview);
        }

        if (this.tool === "select" && this.selected.size) {
            drawSelection(ctx, this.selectedShapes(), camera.zoom);
        }

        if (this.gesture.kind === "marquee") {
            drawMarquee(ctx, this.gesture.box, camera.zoom);
        }

        for (const [userId, cursor] of this.cursors) {
            drawCursor(ctx, cursor.x, cursor.y, cursor.name, peerColor(userId), camera.zoom);
        }

        ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    /* ── shape bookkeeping ─────────────────────────────────────────────── */

    private addShapes(shapes: Shape[]) {
        for (const shape of shapes) {
            if (this.byId.has(shape.id)) continue;
            this.shapes.push(shape);
            this.byId.set(shape.id, shape);
        }
        this.emitShapeCount();
    }

    private removeShapes(ids: string[]) {
        const doomed = new Set(ids);
        this.shapes = this.shapes.filter((s) => !doomed.has(s.id));
        for (const id of doomed) {
            this.byId.delete(id);
            this.selected.delete(id);
        }
        this.emitShapeCount();
    }

    private applyUpdate(_before: Shape[], after: Shape[]) {
        const replacements = new Map(after.map((s) => [s.id, s]));
        this.shapes = this.shapes.map((s) => replacements.get(s.id) ?? s);
        for (const shape of after) this.byId.set(shape.id, shape);
    }

    private selectedShapes(): Shape[] {
        // iterating shapes rather than the id set keeps z-order stable
        return this.shapes.filter((s) => this.selected.has(s.id));
    }

    private shapeAt(world: Point): Shape | null {
        const tolerance = 10 / this.camera.zoom;
        // topmost first, so a click picks what is visually on top
        for (let i = this.shapes.length - 1; i >= 0; i--) {
            const shape = this.shapes[i]!;
            if (hitTest(shape, world, tolerance)) return shape;
        }
        return null;
    }

    /* ── history ───────────────────────────────────────────────────────── */

    private pushOp(op: Op) {
        this.undoStack.push(op);
        if (this.undoStack.length > HISTORY_LIMIT) this.undoStack.shift();
        this.redoStack = [];
        this.emitHistory();
    }

    private applyOp(op: Op, reverse: boolean) {
        if (op.type === "add") {
            if (reverse) {
                this.removeShapes(op.shapes.map((s) => s.id));
                this.send({ type: "erase", roomId: this.roomId, shapeIds: op.shapes.map((s) => s.id) });
            } else {
                this.addShapes(op.shapes);
                for (const shape of op.shapes) this.send({ type: "draw", roomId: this.roomId, shape });
            }
        } else if (op.type === "delete") {
            if (reverse) {
                this.addShapes(op.shapes);
                for (const shape of op.shapes) this.send({ type: "draw", roomId: this.roomId, shape });
            } else {
                this.removeShapes(op.shapes.map((s) => s.id));
                this.send({ type: "erase", roomId: this.roomId, shapeIds: op.shapes.map((s) => s.id) });
            }
        } else {
            const target = reverse ? op.before : op.after;
            this.applyUpdate(reverse ? op.after : op.before, target);
            this.send({ type: "update", roomId: this.roomId, shapes: target });
        }
        this.emitSelection();
        this.requestRender();
    }

    /* ── networking ────────────────────────────────────────────────────── */

    private send(payload: Record<string, unknown>) {
        if (this.socket.readyState !== WebSocket.OPEN) return;
        // Imported boards can exceed both the protocol's 200-item limit and
        // the server's 1 MB frame limit. Keep undo, move and restyle valid too.
        const field = payload.type === "update" ? "shapes" : payload.type === "erase" ? "shapeIds" : null;
        if (field && Array.isArray(payload[field])) {
            let batch: unknown[] = [];
            let bytes = 0;
            for (const item of payload[field]) {
                const size = new TextEncoder().encode(JSON.stringify(item)).length;
                if (batch.length && (batch.length === 200 || bytes + size > 900_000)) {
                    this.socket.send(JSON.stringify({ ...payload, [field]: batch }));
                    batch = [];
                    bytes = 0;
                }
                batch.push(item);
                bytes += size;
            }
            if (batch.length) this.socket.send(JSON.stringify({ ...payload, [field]: batch }));
            return;
        }
        this.socket.send(JSON.stringify(payload));
    }

    private onSocketMessage = (event: MessageEvent) => {
        let message: unknown;
        try {
            message = JSON.parse(event.data);
        } catch {
            return;
        }
        if (typeof message !== "object" || message === null) return;
        const data = message as Record<string, unknown>;

        if (data.type === "draw" || data.type === "update") {
            const incoming = data.type === "draw" ? [data.shape] : data.shapes;
            if (!Array.isArray(incoming)) {
                if (data.type !== "draw") return;
            }
            const list = Array.isArray(incoming) ? incoming : [incoming];
            // a peer's payload is parsed with the same schema the server uses,
            // so a bad frame cannot wedge the renderer
            const shapes = list.flatMap((raw) => {
                const parsed = ShapeSchema.safeParse(raw);
                return parsed.success ? [parsed.data] : [];
            });
            if (!shapes.length) return;
            const fresh = shapes.filter((s) => !this.byId.has(s.id));
            const changed = shapes.filter((s) => this.byId.has(s.id));
            if (fresh.length) this.addShapes(fresh);
            if (changed.length) this.applyUpdate(changed, changed);
            this.requestRender();
            return;
        }

        if (data.type === "erase" && Array.isArray(data.shapeIds)) {
            this.removeShapes(data.shapeIds.filter((id): id is string => typeof id === "string"));
            this.emitSelection();
            this.requestRender();
            return;
        }

        if (data.type === "presence" && Array.isArray(data.users)) {
            this.peers = new Map(
                data.users
                    .filter((u): u is Peer => typeof u?.userId === "string" && typeof u?.name === "string")
                    .map((u) => [u.userId, u])
            );
            for (const userId of [...this.cursors.keys()]) {
                if (!this.peers.has(userId)) this.cursors.delete(userId);
            }
            this.callbacks.onPeersChange?.([...this.peers.values()]);
            this.requestRender();
            return;
        }

        if (data.type === "cursor" && typeof data.userId === "string") {
            const x = Number(data.x);
            const y = Number(data.y);
            if (!Number.isFinite(x) || !Number.isFinite(y)) return;
            this.cursors.set(data.userId, {
                x, y,
                name: typeof data.name === "string" ? data.name : "",
                at: Date.now()
            });
            this.requestRender();
        }
    };

    private sendCursor(world: Point) {
        const now = Date.now();
        // pointermove fires far more often than anyone needs to see a cursor
        if (now - this.lastCursorSentAt < CURSOR_INTERVAL_MS) return;
        this.lastCursorSentAt = now;
        this.send({ type: "cursor", roomId: this.roomId, x: world.x, y: world.y });
    }

    /* ── input ─────────────────────────────────────────────────────────── */

    private isPanGesture(e: PointerEvent) {
        return this.tool === "hand" || this.spaceHeld || e.button === 1;
    }

    private onPointerDown = (e: PointerEvent) => {
        if (e.button !== 0 && e.button !== 1) return;
        this.canvas.setPointerCapture(e.pointerId);
        const screen = this.eventPoint(e);
        const world = this.toWorld(screen);

        if (this.isPanGesture(e)) {
            this.gesture = {
                kind: "pan",
                startScroll: { x: this.camera.scrollX, y: this.camera.scrollY },
                origin: screen
            };
            return;
        }

        if (this.tool === "eraser") {
            this.gesture = { kind: "erase", erased: [] };
            this.eraseAt(world);
            return;
        }

        if (this.tool === "text") {
            this.openTextEditor(world, null);
            return;
        }

        if (this.tool === "select") {
            const hit = this.shapeAt(world);
            if (hit) {
                if (e.shiftKey) {
                    if (this.selected.has(hit.id)) this.selected.delete(hit.id);
                    else this.selected.add(hit.id);
                } else if (!this.selected.has(hit.id)) {
                    this.selected = new Set([hit.id]);
                }
                this.emitSelection();
                this.gesture = {
                    kind: "move",
                    origin: world,
                    last: world,
                    before: this.selectedShapes(),
                    moved: false
                };
                this.requestRender();
                return;
            }
            if (!e.shiftKey) this.clearSelection();
            this.gesture = {
                kind: "marquee",
                origin: world,
                box: { minX: world.x, minY: world.y, maxX: world.x, maxY: world.y },
                additive: e.shiftKey
            };
            return;
        }

        this.gesture = { kind: "draw", start: world, points: [world], preview: null };
    };

    private onPointerMove = (e: PointerEvent) => {
        const screen = this.eventPoint(e);
        const world = this.toWorld(screen);
        this.sendCursor(world);

        switch (this.gesture.kind) {
            case "pan": {
                this.camera.scrollX = this.gesture.startScroll.x + (screen.x - this.gesture.origin.x);
                this.camera.scrollY = this.gesture.startScroll.y + (screen.y - this.gesture.origin.y);
                this.emitCamera();
                this.requestRender();
                return;
            }
            case "draw": {
                if (this.tool === "pencil") this.gesture.points.push(world);
                this.gesture.preview = this.buildShape(this.gesture, world, e.shiftKey);
                this.requestRender();
                return;
            }
            case "move": {
                const dx = world.x - this.gesture.last.x;
                const dy = world.y - this.gesture.last.y;
                if (!dx && !dy) return;
                this.gesture.last = world;
                this.gesture.moved = true;
                const moved = this.selectedShapes().map((s) => translateShape(s, dx, dy));
                this.applyUpdate(moved, moved);
                this.requestRender();
                return;
            }
            case "marquee": {
                this.gesture.box = {
                    minX: Math.min(this.gesture.origin.x, world.x),
                    minY: Math.min(this.gesture.origin.y, world.y),
                    maxX: Math.max(this.gesture.origin.x, world.x),
                    maxY: Math.max(this.gesture.origin.y, world.y)
                };
                this.requestRender();
                return;
            }
            case "erase": {
                this.eraseAt(world);
                return;
            }
        }
    };

    private onPointerUp = (e: PointerEvent) => {
        if (this.canvas.hasPointerCapture(e.pointerId)) {
            this.canvas.releasePointerCapture(e.pointerId);
        }
        const world = this.toWorld(this.eventPoint(e));
        const gesture = this.gesture;
        this.gesture = { kind: "none" };

        switch (gesture.kind) {
            case "draw": {
                const shape = this.buildShape(gesture, world, e.shiftKey);
                if (shape) {
                    this.addShapes([shape]);
                    this.pushOp({ type: "add", shapes: [shape] });
                    this.send({ type: "draw", roomId: this.roomId, shape });
                    // only a drag that produced something counts as finishing
                    // the tool; a stray click should leave it armed
                    this.callbacks.onToolFinished?.();
                }
                break;
            }
            case "move": {
                if (!gesture.moved) break;
                const after = this.selectedShapes();
                this.pushOp({ type: "update", before: gesture.before, after });
                this.send({ type: "update", roomId: this.roomId, shapes: after });
                break;
            }
            case "marquee": {
                const dragged = Math.max(
                    Math.abs(gesture.box.maxX - gesture.box.minX),
                    Math.abs(gesture.box.maxY - gesture.box.minY)
                ) * this.camera.zoom;
                if (dragged >= CLICK_SLOP) {
                    if (!gesture.additive) this.selected.clear();
                    for (const shape of this.shapes) {
                        if (boundsIntersect(shapeBounds(shape), gesture.box)) {
                            this.selected.add(shape.id);
                        }
                    }
                    this.emitSelection();
                }
                break;
            }
            case "erase": {
                if (!gesture.erased.length) break;
                this.pushOp({ type: "delete", shapes: gesture.erased });
                this.send({
                    type: "erase",
                    roomId: this.roomId,
                    shapeIds: gesture.erased.map((s) => s.id)
                });
                break;
            }
        }

        this.requestRender();
    };

    private onDoubleClick = (e: MouseEvent) => {
        if (this.tool !== "select" && this.tool !== "text") return;
        const world = this.toWorld(this.eventPoint(e));
        const hit = this.shapeAt(world);
        if (hit && hit.type === "text") {
            this.openTextEditor({ x: hit.x, y: hit.y }, hit.id, hit.text, hit.fontSize);
            return;
        }
        if (this.tool === "text" || !hit) this.openTextEditor(world, null);
    };

    private onContextMenu = (e: MouseEvent) => {
        // the middle/right drag pan would otherwise open the browser menu
        if (this.spaceHeld || this.tool === "hand") e.preventDefault();
    };

    private onWheel = (e: WheelEvent) => {
        e.preventDefault();
        const at = this.eventPoint(e);

        // ctrl/cmd + wheel is the platform gesture for zoom, and trackpad
        // pinches arrive as a ctrl-modified wheel event too
        if (e.ctrlKey || e.metaKey) {
            const factor = Math.exp(-e.deltaY * 0.01);
            this.setZoom(this.camera.zoom * factor, at);
            return;
        }

        const scale = e.deltaMode === 1 ? 16 : 1;
        this.camera.scrollX -= e.deltaX * scale;
        this.camera.scrollY -= e.deltaY * scale;
        this.emitCamera();
        this.requestRender();
    };

    private onKeyDown = (e: KeyboardEvent) => {
        const target = e.target as HTMLElement | null;
        if (target?.closest('[role="dialog"], [role="menu"], button, select, a')) return;
        if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
            return;
        }

        if (e.code === "Space" && !this.spaceHeld) {
            this.spaceHeld = true;
            this.canvas.style.cursor = "grab";
            e.preventDefault();
            return;
        }

        const mod = e.ctrlKey || e.metaKey;
        const key = e.key.toLowerCase();

        if (mod && key === "z") {
            e.preventDefault();
            if (e.shiftKey) this.redo(); else this.undo();
            return;
        }
        if (mod && key === "y") {
            e.preventDefault();
            this.redo();
            return;
        }
        if (mod && key === "a") {
            e.preventDefault();
            this.selectAll();
            return;
        }
        if (mod && key === "d") {
            e.preventDefault();
            this.duplicateSelection();
            return;
        }
        if (mod) return;

        if (e.key === "Delete" || e.key === "Backspace") {
            e.preventDefault();
            this.deleteSelection();
            return;
        }
        if (e.key === "Escape") {
            this.clearSelection();
            return;
        }
        if (e.key.startsWith("Arrow") && this.selected.size) {
            e.preventDefault();
            const step = e.shiftKey ? 10 : 1;
            const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
            const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
            const before = this.selectedShapes();
            const after = before.map((s) => translateShape(s, dx, dy));
            this.applyUpdate(before, after);
            this.pushOp({ type: "update", before, after });
            this.send({ type: "update", roomId: this.roomId, shapes: after });
            this.requestRender();
        }
    };

    private onKeyUp = (e: KeyboardEvent) => {
        if (e.code === "Space") {
            this.spaceHeld = false;
            this.canvas.style.cursor = "";
        }
    };

    private onWindowBlur = () => {
        // a tab switch mid-pan otherwise leaves space stuck down
        this.spaceHeld = false;
        this.canvas.style.cursor = "";
    };

    /* ── gesture helpers ───────────────────────────────────────────────── */

    private eraseAt(world: Point) {
        if (this.gesture.kind !== "erase") return;
        const hit = this.shapeAt(world);
        if (!hit) return;
        this.gesture.erased.push(hit);
        this.removeShapes([hit.id]);
        this.requestRender();
    }

    private buildShape(
        gesture: { start: Point; points: Point[] },
        end: Point,
        constrain: boolean
    ): Shape | null {
        const style = { ...this.style };
        const id = newShapeId();
        let { x: endX, y: endY } = end;

        // holding shift squares off boxes and snaps lines to 15° increments,
        // which is what makes tidy diagrams possible without a grid snap
        if (constrain && this.tool !== "pencil") {
            const dx = endX - gesture.start.x;
            const dy = endY - gesture.start.y;
            if (this.tool === "line" || this.tool === "arrow") {
                const angle = Math.round(Math.atan2(dy, dx) / (Math.PI / 12)) * (Math.PI / 12);
                const length = Math.hypot(dx, dy);
                endX = gesture.start.x + Math.cos(angle) * length;
                endY = gesture.start.y + Math.sin(angle) * length;
            } else {
                const size = Math.max(Math.abs(dx), Math.abs(dy));
                endX = gesture.start.x + Math.sign(dx || 1) * size;
                endY = gesture.start.y + Math.sign(dy || 1) * size;
            }
        }

        const width = endX - gesture.start.x;
        const height = endY - gesture.start.y;
        const tiny = Math.abs(width) < 2 && Math.abs(height) < 2;

        switch (this.tool) {
            case "rect":
                return tiny ? null : { type: "rect", id, x: gesture.start.x, y: gesture.start.y, width, height, style };
            case "diamond":
                return tiny ? null : { type: "diamond", id, x: gesture.start.x, y: gesture.start.y, width, height, style };
            case "ellipse":
                return tiny ? null : {
                    type: "circle",
                    id,
                    centerX: gesture.start.x + width / 2,
                    centerY: gesture.start.y + height / 2,
                    radiusX: Math.abs(width / 2),
                    radiusY: Math.abs(height / 2),
                    style
                };
            case "line":
                return tiny ? null : { type: "line", id, startX: gesture.start.x, startY: gesture.start.y, endX, endY, style };
            case "arrow":
                return tiny ? null : { type: "arrow", id, startX: gesture.start.x, startY: gesture.start.y, endX, endY, style };
            case "pencil": {
                if (gesture.points.length < 2) return null;
                // long strokes are thinned out so a slow drag does not store
                // thousands of samples a millimetre apart
                const points = simplify(gesture.points, 0.6 / this.camera.zoom).slice(0, 5000);
                if (points.length < 2) return null;
                return { type: "pencil", id, points, style };
            }
            default:
                return null;
        }
    }

    private openTextEditor(world: Point, shapeId: string | null, value = "", fontSize?: number) {
        const screen = this.toScreen(world);
        const size = fontSize ?? Math.max(12, Math.round(16 + this.style.strokeWidth * 2));
        this.callbacks.onTextEdit?.({
            shapeId,
            value,
            left: screen.x,
            top: screen.y,
            fontSize: size * this.camera.zoom,
            color: this.style.strokeColor
        });
    }

    /** Turns the screen position the overlay input sat at back into world space. */
    worldAt(screen: Point) {
        return this.toWorld(screen);
    }

    fontSizeFor(screenFontSize: number) {
        return screenFontSize / this.camera.zoom;
    }

    measureText(text: string, fontSize: number) {
        this.ctx.save();
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.font = fontFor(fontSize);
        const width = Math.max(...text.split("\n").map((line) => this.ctx.measureText(line).width), 0);
        this.ctx.restore();
        return width;
    }

    /* ── callbacks ─────────────────────────────────────────────────────── */

    private emitCamera() {
        this.callbacks.onCameraChange?.({ ...this.camera });
    }

    private emitSelection() {
        this.callbacks.onSelectionChange?.(this.selectedShapes());
    }

    private emitShapeCount() {
        this.callbacks.onShapeCountChange?.(this.shapes.length);
    }

    private emitHistory() {
        this.callbacks.onHistoryChange?.({
            canUndo: this.undoStack.length > 0,
            canRedo: this.redoStack.length > 0
        });
    }
}

/**
 * Ramer–Douglas–Peucker, run iteratively so a very long stroke cannot blow the
 * call stack the way the textbook recursive version does.
 */
function simplify(points: Point[], tolerance: number): Point[] {
    if (points.length < 3 || tolerance <= 0) return points;

    const keep = new Uint8Array(points.length);
    keep[0] = 1;
    keep[points.length - 1] = 1;
    const stack: [number, number][] = [[0, points.length - 1]];

    while (stack.length) {
        const [start, end] = stack.pop()!;
        const a = points[start]!;
        const b = points[end]!;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const lengthSq = dx * dx + dy * dy;

        let worst = -1;
        let worstIndex = -1;
        for (let i = start + 1; i < end; i++) {
            const p = points[i]!;
            let distance: number;
            if (lengthSq === 0) {
                distance = Math.hypot(p.x - a.x, p.y - a.y);
            } else {
                let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSq;
                t = Math.max(0, Math.min(1, t));
                distance = Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
            }
            if (distance > worst) {
                worst = distance;
                worstIndex = i;
            }
        }

        if (worst > tolerance && worstIndex > 0) {
            keep[worstIndex] = 1;
            stack.push([start, worstIndex], [worstIndex, end]);
        }
    }

    return points.filter((_, i) => keep[i]);
}
