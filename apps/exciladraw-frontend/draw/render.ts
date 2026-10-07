import { BOARD_PALETTES, displayStyle, displayColor, type BoardTheme } from "./theme";
import { shapeBounds } from "./geometry";
import { DEFAULT_STYLE, type Bounds, type LegacyShapeFields, type Shape, type ShapeStyle } from "./types";

/** Grid spacings we step through as you zoom, so lines never crowd together. */
const GRID_STEPS = [10, 20, 50, 100, 250, 500, 1000, 2500];

function gridSpacing(zoom: number) {
    // aim for a cell roughly 20 screen pixels wide at the current zoom
    const target = 20 / zoom;
    return GRID_STEPS.find((step) => step >= target) ?? GRID_STEPS[GRID_STEPS.length - 1]!;
}

export function drawGrid(
    ctx: CanvasRenderingContext2D,
    viewport: Bounds,
    zoom: number,
    theme: BoardTheme = "dark"
) {
    const spacing = gridSpacing(zoom);
    const startX = Math.floor(viewport.minX / spacing) * spacing;
    const startY = Math.floor(viewport.minY / spacing) * spacing;

    ctx.save();
    ctx.lineWidth = 1 / zoom;
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;

    // every fifth line is drawn brighter, which keeps a sense of scale while
    // panning without needing a second, denser grid
    for (const major of [false, true]) {
        ctx.strokeStyle = major ? BOARD_PALETTES[theme].majorGrid : BOARD_PALETTES[theme].grid;
        ctx.beginPath();
        for (let x = startX; x <= viewport.maxX; x += spacing) {
            if ((Math.round(x / spacing) % 5 === 0) !== major) continue;
            ctx.moveTo(x, viewport.minY);
            ctx.lineTo(x, viewport.maxY);
        }
        for (let y = startY; y <= viewport.maxY; y += spacing) {
            if ((Math.round(y / spacing) % 5 === 0) !== major) continue;
            ctx.moveTo(viewport.minX, y);
            ctx.lineTo(viewport.maxX, y);
        }
        ctx.stroke();
    }
    ctx.restore();
}

function applyStyle(ctx: CanvasRenderingContext2D, style: ShapeStyle) {
    ctx.strokeStyle = style.strokeColor;
    ctx.lineWidth = style.strokeWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.globalAlpha = style.opacity / 100;

    // dash lengths are scaled by stroke width so a thick dashed line reads as
    // dashed rather than as a solid one with hairline gaps
    const w = Math.max(1, style.strokeWidth);
    if (style.strokeStyle === "dashed") {
        ctx.setLineDash([w * 4, w * 4]);
    } else if (style.strokeStyle === "dotted") {
        ctx.setLineDash([w * 0.5, w * 3]);
    } else {
        ctx.setLineDash([]);
    }
}

function fillIfNeeded(ctx: CanvasRenderingContext2D, style: ShapeStyle) {
    if (style.fillColor && style.fillColor !== "transparent") {
        ctx.fillStyle = style.fillColor;
        ctx.fill();
    }
}

/**
 * Smooths a freehand stroke by running a quadratic curve through the midpoint
 * of each pair of samples. Pointer samples are coarse enough that joining them
 * with straight segments makes every stroke look faceted.
 */
function tracePencil(ctx: CanvasRenderingContext2D, points: { x: number; y: number }[]) {
    const [first, second] = points;
    if (!first) return;
    ctx.beginPath();
    ctx.moveTo(first.x, first.y);
    if (!second) return;
    if (points.length === 2) {
        ctx.lineTo(second.x, second.y);
        return;
    }
    for (let i = 1; i < points.length - 1; i++) {
        const current = points[i]!;
        const next = points[i + 1]!;
        ctx.quadraticCurveTo(
            current.x,
            current.y,
            (current.x + next.x) / 2,
            (current.y + next.y) / 2
        );
    }
    const last = points[points.length - 1]!;
    ctx.lineTo(last.x, last.y);
}

function drawArrowHead(
    ctx: CanvasRenderingContext2D,
    fromX: number, fromY: number,
    toX: number, toY: number,
    strokeWidth: number
) {
    const angle = Math.atan2(toY - fromY, toX - fromX);
    const length = Math.min(
        18 + strokeWidth * 2,
        // a short arrow should not be swallowed by its own head
        Math.max(6, Math.hypot(toX - fromX, toY - fromY) * 0.4)
    );
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - length * Math.cos(angle - Math.PI / 7), toY - length * Math.sin(angle - Math.PI / 7));
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - length * Math.cos(angle + Math.PI / 7), toY - length * Math.sin(angle + Math.PI / 7));
    ctx.stroke();
}

// canvas' font parser does not resolve CSS variables, so the board resolves
// the page's computed family once and hands the literal stack over here
let fontFamily = 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';

export function setFontFamily(family: string) {
    if (family.trim()) fontFamily = family;
}

export function fontFor(fontSize: number) {
    return `${fontSize}px ${fontFamily}`;
}

export function drawShape(ctx: CanvasRenderingContext2D, shape: Shape, theme: BoardTheme = "dark") {
    const style = displayStyle({ ...DEFAULT_STYLE, ...(shape.style ?? {}) }, theme);
    const legacy = shape as unknown as LegacyShapeFields;

    ctx.save();
    applyStyle(ctx, style);

    switch (shape.type) {
        case "rect": {
            ctx.beginPath();
            if (style.edges === "round") {
                const r = Math.min(
                    32,
                    Math.abs(shape.width) / 4,
                    Math.abs(shape.height) / 4
                );
                ctx.roundRect(shape.x, shape.y, shape.width, shape.height, r);
            } else {
                ctx.rect(shape.x, shape.y, shape.width, shape.height);
            }
            fillIfNeeded(ctx, style);
            ctx.stroke();
            break;
        }
        case "diamond": {
            const { x, y, width, height } = shape;
            ctx.beginPath();
            ctx.moveTo(x + width / 2, y);
            ctx.lineTo(x + width, y + height / 2);
            ctx.lineTo(x + width / 2, y + height);
            ctx.lineTo(x, y + height / 2);
            ctx.closePath();
            fillIfNeeded(ctx, style);
            ctx.stroke();
            break;
        }
        case "circle": {
            ctx.beginPath();
            ctx.ellipse(
                shape.centerX,
                shape.centerY,
                Math.abs(shape.radiusX ?? legacy.radius ?? 0),
                Math.abs(shape.radiusY ?? legacy.radius ?? 0),
                0, 0, Math.PI * 2
            );
            fillIfNeeded(ctx, style);
            ctx.stroke();
            break;
        }
        case "line": {
            ctx.beginPath();
            ctx.moveTo(shape.startX, shape.startY);
            ctx.lineTo(shape.endX, shape.endY);
            ctx.stroke();
            break;
        }
        case "arrow": {
            ctx.beginPath();
            ctx.moveTo(shape.startX, shape.startY);
            ctx.lineTo(shape.endX, shape.endY);
            ctx.stroke();
            drawArrowHead(ctx, shape.startX, shape.startY, shape.endX, shape.endY, style.strokeWidth);
            break;
        }
        case "text": {
            ctx.setLineDash([]);
            ctx.fillStyle = style.strokeColor;
            ctx.font = fontFor(shape.fontSize);
            ctx.textBaseline = "top";
            shape.text.split("\n").forEach((line, i) => {
                ctx.fillText(line, shape.x, shape.y + i * shape.fontSize * 1.25);
            });
            break;
        }
        case "pencil": {
            let points = shape.points ?? [];
            if (!points.length && legacy.startX !== undefined) {
                points = [
                    { x: legacy.startX, y: legacy.startY ?? 0 },
                    { x: legacy.endX ?? 0, y: legacy.endY ?? 0 }
                ];
            }
            if (points.length < 2) break;
            tracePencil(ctx, points);
            ctx.stroke();
            break;
        }
    }

    ctx.restore();
}

/** The dashed box and handles around the current selection. */
export function drawSelection(
    ctx: CanvasRenderingContext2D,
    shapes: Shape[],
    zoom: number,
    theme: BoardTheme = "dark"
) {
    if (!shapes.length) return;
    const pad = 6 / zoom;

    ctx.save();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = BOARD_PALETTES[theme].accent;
    ctx.lineWidth = 1 / zoom;

    // an outline per shape reads better than one box when several are selected
    if (shapes.length > 1) {
        ctx.globalAlpha = 0.45;
        for (const shape of shapes) {
            const b = shapeBounds(shape);
            ctx.strokeRect(b.minX - pad, b.minY - pad, b.maxX - b.minX + pad * 2, b.maxY - b.minY + pad * 2);
        }
        ctx.globalAlpha = 1;
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const shape of shapes) {
        const b = shapeBounds(shape);
        minX = Math.min(minX, b.minX); minY = Math.min(minY, b.minY);
        maxX = Math.max(maxX, b.maxX); maxY = Math.max(maxY, b.maxY);
    }
    if (!Number.isFinite(minX)) { ctx.restore(); return; }

    const x = minX - pad, y = minY - pad;
    const w = maxX - minX + pad * 2, h = maxY - minY + pad * 2;
    ctx.strokeRect(x, y, w, h);

    const handle = 4 / zoom;
    ctx.fillStyle = BOARD_PALETTES[theme].background;
    for (const [hx, hy] of [[x, y], [x + w, y], [x, y + h], [x + w, y + h]] as const) {
        ctx.beginPath();
        ctx.rect(hx - handle, hy - handle, handle * 2, handle * 2);
        ctx.fill();
        ctx.stroke();
    }
    ctx.restore();
}

/** The translucent rectangle dragged out to select several shapes at once. */
export function drawMarquee(ctx: CanvasRenderingContext2D, box: Bounds, zoom: number, theme: BoardTheme = "dark") {
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.setLineDash([]);
    ctx.fillStyle = `${BOARD_PALETTES[theme].accent}18`;
    ctx.strokeStyle = BOARD_PALETTES[theme].accent;
    ctx.lineWidth = 1 / zoom;
    const w = box.maxX - box.minX;
    const h = box.maxY - box.minY;
    ctx.fillRect(box.minX, box.minY, w, h);
    ctx.strokeRect(box.minX, box.minY, w, h);
    ctx.restore();
}

// the pen tray, so a collaborator's cursor is coloured like the ink they draw with
const PEER_COLORS = ["#a78bfa", "#4ade80", "#60a5fa", "#ff8fb1", "#fbbf24", "#ff6b6b"];

export function peerColor(userId: string) {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
        hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
    }
    return PEER_COLORS[hash % PEER_COLORS.length]!;
}

/**
 * Another person's pointer. Drawn at a fixed screen size so a collaborator's
 * cursor stays readable however far you are zoomed out.
 */
export function drawCursor(
    ctx: CanvasRenderingContext2D,
    x: number, y: number,
    name: string,
    color: string,
    zoom: number,
    theme: BoardTheme = "dark"
) {
    const s = 1 / zoom;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.globalAlpha = 1;
    ctx.setLineDash([]);

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 17);
    ctx.lineTo(4.4, 12.8);
    ctx.lineTo(10.5, 12.2);
    ctx.closePath();
    ctx.fillStyle = displayColor(color, theme);
    ctx.strokeStyle = BOARD_PALETTES[theme].background;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fill();

    if (name) {
        ctx.font = fontFor(11);
        ctx.textBaseline = "top";
        const label = name.length > 18 ? `${name.slice(0, 17)}…` : name;
        const width = ctx.measureText(label).width;
        ctx.fillStyle = displayColor(color, theme);
        ctx.beginPath();
        ctx.roundRect(11, 15, width + 12, 19, 6);
        ctx.fill();
        ctx.fillStyle = BOARD_PALETTES[theme].background;
        ctx.fillText(label, 17, 19);
    }
    ctx.restore();
}
