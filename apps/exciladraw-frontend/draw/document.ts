import { ShapeSchema } from "@repo/common/types";
import { boundsOf, translateShape } from "./geometry";
import { newShapeId, type Point, type Shape } from "./types";

export const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;
export const MAX_DOCUMENT_SHAPES = 2000;
const FORMAT = "exciladraw";

/** Validate the whole document before any shapes are added to a live board. */
export function parseDocument(text: string): Shape[] {
    if (new TextEncoder().encode(text).length > MAX_DOCUMENT_BYTES) {
        throw new Error("This file is too large. Choose a board file under 5 MB.");
    }
    let raw: unknown;
    try { raw = JSON.parse(text); } catch {
        throw new Error("This file is not valid JSON. Choose an Exciladraw board file.");
    }
    if (!raw || typeof raw !== "object" || !("type" in raw) || raw.type !== FORMAT) {
        throw new Error("Choose an Exciladraw board file (.exciladraw.json).");
    }
    if (!("version" in raw) || raw.version !== 1) {
        throw new Error("This board file uses an unsupported version.");
    }
    if (!("shapes" in raw) || !Array.isArray(raw.shapes) || raw.shapes.length > MAX_DOCUMENT_SHAPES) {
        throw new Error(`A board file can contain up to ${MAX_DOCUMENT_SHAPES} shapes.`);
    }
    if (!raw.shapes.length) throw new Error("This board file has no shapes to insert.");
    return raw.shapes.map((item, index) => {
        const parsed = ShapeSchema.safeParse(item);
        if (!parsed.success) throw new Error(`Shape ${index + 1} is invalid. Nothing was imported.`);
        const shape = parsed.data;
        const bounds = boundsOf([shape]);
        // Extreme coordinates can overflow transforms or hang grid rendering.
        if (!bounds || Object.values(bounds).some((value) => !Number.isFinite(value) || Math.abs(value) > 10_000_000)
            || (shape.type === "text" && (shape.fontSize <= 0 || shape.fontSize > 10000))) {
            throw new Error(`Shape ${index + 1} has unsupported dimensions. Nothing was imported.`);
        }
        return shape;
    });
}

export function serializeDocument(shapes: Shape[]): string {
    const text = JSON.stringify({ type: FORMAT, version: 1, shapes }, null, 2);
    // Every downloaded file must be something this app can open again.
    parseDocument(text);
    return text;
}

/** Fresh IDs let the same file be reused without overwriting existing work. */
export function prepareInsertion(shapes: Shape[], center: Point): Shape[] {
    const bounds = boundsOf(shapes);
    if (!bounds) return [];
    const dx = center.x - (bounds.minX + bounds.maxX) / 2;
    const dy = center.y - (bounds.minY + bounds.maxY) / 2;
    return shapes.map((shape) => ({ ...translateShape(shape, dx, dy), id: newShapeId() }));
}
