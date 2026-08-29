import type { Shape, ShapeStyle } from "@repo/common/types";

export type { Shape, ShapeStyle };

export type Point = { x: number; y: number };

export type Bounds = { minX: number; minY: number; maxX: number; maxY: number };

/** Where the viewport is looking. `screen = world * zoom + scroll`. */
export type Camera = { scrollX: number; scrollY: number; zoom: number };

export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 8;

export const DEFAULT_STYLE: ShapeStyle = {
    strokeColor: "#e3e3e8",
    fillColor: "transparent",
    strokeWidth: 2,
    strokeStyle: "solid",
    edges: "sharp",
    opacity: 100
};

/**
 * Shapes written by older versions of the app that may still be sitting in the
 * database: circles stored a single radius, pencil strokes a lone segment, and
 * nothing carried an id.
 */
export type LegacyShapeFields = {
    radius?: number;
    startX?: number;
    startY?: number;
    endX?: number;
    endY?: number;
};

let idCounter = 0;

export function newShapeId() {
    // crypto.randomUUID needs a secure context, which a plain-http LAN preview
    // is not, so fall back to something collision-resistant enough for a room
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }
    idCounter += 1;
    return `${Date.now().toString(36)}-${idCounter}-${Math.random().toString(36).slice(2, 10)}`;
}
