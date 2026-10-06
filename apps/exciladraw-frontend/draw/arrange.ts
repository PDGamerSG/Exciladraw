import { boundsOf, shapeBounds, translateShape } from "./geometry";
import type { Shape } from "./types";

export type Arrangement = "left" | "center" | "right" | "top" | "middle" | "bottom" | "horizontal" | "vertical";

/** Preserve paint order and dimensions; only positions change. */
export function arrangeShapes(shapes: Shape[], action: Arrangement): Shape[] {
    const bounds = boundsOf(shapes);
    if (!bounds || shapes.length < 2) return shapes;
    if (action === "horizontal" || action === "vertical") {
        if (shapes.length < 3) return shapes;
        const min = action === "horizontal" ? "minX" : "minY";
        const max = action === "horizontal" ? "maxX" : "maxY";
        const sorted = shapes.map((shape) => ({ shape, bounds: shapeBounds(shape) }))
            .sort((a, b) => a.bounds[min] - b.bounds[min]);
        const first = sorted[0]!;
        const last = sorted[sorted.length - 1]!;
        const occupied = sorted.reduce((sum, item) => sum + item.bounds[max] - item.bounds[min], 0);
        const gap = (last.bounds[max] - first.bounds[min] - occupied) / (sorted.length - 1);
        let position = first.bounds[min];
        const replacements = new Map<string, Shape>();
        for (const item of sorted) {
            const delta = position - item.bounds[min];
            replacements.set(item.shape.id, translateShape(item.shape,
                action === "horizontal" ? delta : 0, action === "vertical" ? delta : 0));
            position += item.bounds[max] - item.bounds[min] + gap;
        }
        return shapes.map((shape) => replacements.get(shape.id)!);
    }
    return shapes.map((shape) => {
        const b = shapeBounds(shape);
        let dx = 0, dy = 0;
        if (action === "left") dx = bounds.minX - b.minX;
        if (action === "center") dx = (bounds.minX + bounds.maxX - b.minX - b.maxX) / 2;
        if (action === "right") dx = bounds.maxX - b.maxX;
        if (action === "top") dy = bounds.minY - b.minY;
        if (action === "middle") dy = (bounds.minY + bounds.maxY - b.minY - b.maxY) / 2;
        if (action === "bottom") dy = bounds.maxY - b.maxY;
        return translateShape(shape, dx, dy);
    });
}
