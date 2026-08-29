import type { Bounds, Point, Shape } from "./types";

/** The axis-aligned box a shape occupies, ignoring stroke width. */
export function shapeBounds(shape: Shape): Bounds {
    switch (shape.type) {
        case "rect":
        case "diamond": {
            const minX = Math.min(shape.x, shape.x + shape.width);
            const minY = Math.min(shape.y, shape.y + shape.height);
            return {
                minX,
                minY,
                maxX: minX + Math.abs(shape.width),
                maxY: minY + Math.abs(shape.height)
            };
        }
        case "circle":
            return {
                minX: shape.centerX - Math.abs(shape.radiusX),
                minY: shape.centerY - Math.abs(shape.radiusY),
                maxX: shape.centerX + Math.abs(shape.radiusX),
                maxY: shape.centerY + Math.abs(shape.radiusY)
            };
        case "line":
        case "arrow":
            return {
                minX: Math.min(shape.startX, shape.endX),
                minY: Math.min(shape.startY, shape.endY),
                maxX: Math.max(shape.startX, shape.endX),
                maxY: Math.max(shape.startY, shape.endY)
            };
        case "text":
            // a rough box; the renderer measures the real one and the small
            // difference does not matter for hit testing a click on a label
            return {
                minX: shape.x,
                minY: shape.y,
                maxX: shape.x + shape.text.length * shape.fontSize * 0.55,
                maxY: shape.y + shape.fontSize * 1.25
            };
        case "pencil": {
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            for (const p of shape.points) {
                if (p.x < minX) minX = p.x;
                if (p.y < minY) minY = p.y;
                if (p.x > maxX) maxX = p.x;
                if (p.y > maxY) maxY = p.y;
            }
            return { minX, minY, maxX, maxY };
        }
    }
}

export function boundsOf(shapes: Shape[]): Bounds | null {
    if (!shapes.length) return null;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const shape of shapes) {
        const b = shapeBounds(shape);
        if (b.minX < minX) minX = b.minX;
        if (b.minY < minY) minY = b.minY;
        if (b.maxX > maxX) maxX = b.maxX;
        if (b.maxY > maxY) maxY = b.maxY;
    }
    if (!Number.isFinite(minX)) return null;
    return { minX, minY, maxX, maxY };
}

export function boundsIntersect(a: Bounds, b: Bounds) {
    return a.minX <= b.maxX && a.maxX >= b.minX && a.minY <= b.maxY && a.maxY >= b.minY;
}

function pointInBounds(p: Point, b: Bounds, pad: number) {
    return p.x >= b.minX - pad && p.x <= b.maxX + pad
        && p.y >= b.minY - pad && p.y <= b.maxY + pad;
}

/** Distance from a point to the segment ab, used for every line-ish hit test. */
function distanceToSegment(p: Point, a: Point, b: Point) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const lengthSq = dx * dx + dy * dy;
    if (lengthSq === 0) return Math.hypot(p.x - a.x, p.y - a.y);
    let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSq;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

function nearPolyline(p: Point, points: Point[], tolerance: number, close = false) {
    for (let i = 1; i < points.length; i++) {
        const a = points[i - 1]!;
        const b = points[i]!;
        if (distanceToSegment(p, a, b) <= tolerance) return true;
    }
    if (close && points.length > 2) {
        return distanceToSegment(p, points[points.length - 1]!, points[0]!) <= tolerance;
    }
    return false;
}

/**
 * Whether a click lands on a shape. Outlined shapes are only hit near their
 * edge — clicking the hollow middle of a big rectangle should select whatever
 * is behind it, the way every other drawing tool behaves — while a filled
 * shape is hit anywhere inside it.
 */
export function hitTest(shape: Shape, point: Point, tolerance: number): boolean {
    const filled = "style" in shape
        && shape.style !== undefined
        && shape.style.fillColor !== "transparent";

    switch (shape.type) {
        case "rect": {
            const b = shapeBounds(shape);
            if (filled) return pointInBounds(point, b, tolerance);
            const corners = [
                { x: b.minX, y: b.minY },
                { x: b.maxX, y: b.minY },
                { x: b.maxX, y: b.maxY },
                { x: b.minX, y: b.maxY }
            ];
            return nearPolyline(point, corners, tolerance, true);
        }
        case "diamond": {
            const b = shapeBounds(shape);
            const cx = (b.minX + b.maxX) / 2;
            const cy = (b.minY + b.maxY) / 2;
            if (filled) {
                const rx = (b.maxX - b.minX) / 2 + tolerance;
                const ry = (b.maxY - b.minY) / 2 + tolerance;
                if (rx <= 0 || ry <= 0) return false;
                return Math.abs(point.x - cx) / rx + Math.abs(point.y - cy) / ry <= 1;
            }
            const corners = [
                { x: cx, y: b.minY },
                { x: b.maxX, y: cy },
                { x: cx, y: b.maxY },
                { x: b.minX, y: cy }
            ];
            return nearPolyline(point, corners, tolerance, true);
        }
        case "circle": {
            const rx = Math.abs(shape.radiusX);
            const ry = Math.abs(shape.radiusY);
            if (rx === 0 || ry === 0) {
                return pointInBounds(point, shapeBounds(shape), tolerance);
            }
            const dx = (point.x - shape.centerX) / rx;
            const dy = (point.y - shape.centerY) / ry;
            const d = Math.hypot(dx, dy);
            if (filled) return d <= 1 + tolerance / Math.min(rx, ry);
            return Math.abs(d - 1) <= tolerance / Math.min(rx, ry);
        }
        case "line":
        case "arrow":
            return distanceToSegment(
                point,
                { x: shape.startX, y: shape.startY },
                { x: shape.endX, y: shape.endY }
            ) <= tolerance;
        case "text":
            return pointInBounds(point, shapeBounds(shape), tolerance);
        case "pencil":
            return nearPolyline(point, shape.points, tolerance);
    }
}

/** A copy of the shape shifted by (dx, dy). Shapes are treated as immutable. */
export function translateShape(shape: Shape, dx: number, dy: number): Shape {
    switch (shape.type) {
        case "rect":
        case "diamond":
            return { ...shape, x: shape.x + dx, y: shape.y + dy };
        case "circle":
            return { ...shape, centerX: shape.centerX + dx, centerY: shape.centerY + dy };
        case "line":
        case "arrow":
            return {
                ...shape,
                startX: shape.startX + dx,
                startY: shape.startY + dy,
                endX: shape.endX + dx,
                endY: shape.endY + dy
            };
        case "text":
            return { ...shape, x: shape.x + dx, y: shape.y + dy };
        case "pencil":
            return { ...shape, points: shape.points.map((p) => ({ x: p.x + dx, y: p.y + dy })) };
    }
}
