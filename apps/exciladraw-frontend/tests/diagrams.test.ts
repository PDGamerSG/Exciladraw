import assert from "node:assert/strict";
import { test } from "node:test";
import { ShapeSchema } from "@repo/common/types";
import { parseDocument, prepareInsertion, serializeDocument, MAX_DOCUMENT_BYTES, MAX_DOCUMENT_SHAPES } from "../draw/document";
import { arrangeShapes, type Arrangement } from "../draw/arrange";
import { shapeBounds, boundsOf } from "../draw/geometry";
import { BOARD_TEMPLATES } from "../draw/templates";
import type { Shape } from "../draw/types";
import { createMessageQueue } from "../../ws-backend/src/messageQueue";

const rect = (id: string, x: number, y: number, width = 20, height = 30): Shape => ({ id, type: "rect", x, y, width, height });
const document = (shapes: unknown[], version = 1) => JSON.stringify({ type: "exciladraw", version, shapes });

test("all starter templates contain valid editable shapes and round-trip losslessly", () => {
    for (const template of BOARD_TEMPLATES) {
        assert.ok(template.shapes.length > 0);
        assert.equal(new Set(template.shapes.map((shape) => shape.id)).size, template.shapes.length);
        template.shapes.forEach((shape) => assert.ok(ShapeSchema.safeParse(shape).success));
        assert.deepEqual(parseDocument(serializeDocument(template.shapes)), template.shapes);
    }
});

test("malformed, foreign, future, empty and oversized files reject before insertion", () => {
    for (const text of ["{", "null", "[]", JSON.stringify({ type: "excalidraw", version: 1, elements: [] }),
        document([rect("a", 0, 0)], 2), document([]), document([{ type: "unknown" }]),
        document([rect("a", 0, 0), { type: "rect" }]),
        document(Array.from({ length: MAX_DOCUMENT_SHAPES + 1 }, () => rect("a", 0, 0))),
        " ".repeat(MAX_DOCUMENT_BYTES + 1), document([rect("a", 1e100, 0)]),
        document([{ id: "t", type: "text", x: 0, y: 0, text: "invalid", fontSize: -1 }])]) {
        assert.throws(() => parseDocument(text));
    }
});

test("insertion centers every shape type, preserves layout and replaces even duplicate IDs", () => {
    const originals: Shape[] = [rect("same", -20, 30, -40),
        { type: "circle", id: "same", centerX: 80, centerY: 50, radiusX: 25, radiusY: 40 },
        { type: "arrow", id: "arrow", startX: 40, startY: 50, endX: 80, endY: 50 },
        { type: "pencil", id: "pen", points: [{ x: 0, y: 0 }, { x: 60, y: 90 }] },
        { type: "text", id: "text", x: 20, y: 60, text: "Hello\nWorld", fontSize: 20 }];
    const snapshot = structuredClone(originals);
    const inserted = prepareInsertion(originals, { x: 800, y: -200 });
    const b = boundsOf(inserted)!;
    assert.equal((b.minX + b.maxX) / 2, 800);
    assert.equal((b.minY + b.maxY) / 2, -200);
    assert.equal(new Set(inserted.map((s) => s.id)).size, originals.length);
    assert.ok(inserted.every((s) => !originals.some((o) => o.id === s.id)));
    const again = prepareInsertion(originals, { x: 800, y: -200 });
    assert.ok(again.every((s) => !inserted.some((o) => o.id === s.id)));
    assert.deepEqual(originals, snapshot);
});

test("six alignments work across negative boxes, circles and multiline text without resizing", () => {
    const shapes: Shape[] = [rect("box", 100, 50, -40, -20),
        { type: "circle", id: "circle", centerX: 10, centerY: 150, radiusX: 20, radiusY: 30 },
        { type: "text", id: "text", x: 20, y: -30, text: "wide label\nx", fontSize: 20 }];
    for (const action of ["left", "center", "right", "top", "middle", "bottom"] as Arrangement[]) {
        const result = arrangeShapes(shapes, action);
        const boxes = result.map(shapeBounds);
        const anchors = boxes.map((b) => action === "left" ? b.minX : action === "right" ? b.maxX
            : action === "center" ? (b.minX + b.maxX) / 2 : action === "top" ? b.minY
                : action === "bottom" ? b.maxY : (b.minY + b.maxY) / 2);
        assert.ok(anchors.every((value) => Math.abs(value - anchors[0]!) < 1e-8));
        result.forEach((shape, i) => {
            const before = shapeBounds(shapes[i]!);
            const after = shapeBounds(shape);
            assert.ok(Math.abs((after.maxX - after.minX) - (before.maxX - before.minX)) < 1e-8);
            assert.ok(Math.abs((after.maxY - after.minY) - (before.maxY - before.minY)) < 1e-8);
        });
    }
});

test("distribution gives equal gaps with unequal sizes and preserves paint order and endpoints", () => {
    for (const action of ["horizontal", "vertical"] as const) {
        const shapes = [rect("last", 300, 300, 50, 50), rect("first", 0, 0), rect("middle", 30, 50, 80, 60)];
        const result = arrangeShapes(shapes, action);
        assert.deepEqual(result.map((s) => s.id), ["last", "first", "middle"]);
        const [last, first, middle] = result.map(shapeBounds);
        const min = action === "horizontal" ? "minX" : "minY";
        const max = action === "horizontal" ? "maxX" : "maxY";
        assert.equal(middle![min] - first![max], last![min] - middle![max]);
        assert.equal(first![min], 0);
        assert.equal(last![max], 350);
    }
    const pair = [rect("a", 0, 0), rect("b", 50, 50)];
    assert.equal(arrangeShapes(pair, "horizontal"), pair);
});

test("websocket persistence finishes insert before undo and continues after a failure", async () => {
    const events: string[] = [];
    const enqueue = createMessageQueue(() => { events.push("error"); });
    let release!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    void enqueue(async () => { events.push("insert-start"); await gate; events.push("insert-done"); });
    const erase = enqueue(async () => { events.push("undo"); });
    await Promise.resolve();
    assert.deepEqual(events, ["insert-start"]);
    release();
    await erase;
    void enqueue(async () => { throw new Error("failed write"); });
    await enqueue(async () => { events.push("redo"); });
    assert.deepEqual(events, ["insert-start", "insert-done", "undo", "error", "redo"]);
});
