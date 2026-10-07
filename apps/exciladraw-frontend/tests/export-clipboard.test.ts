import assert from "node:assert/strict";
import { test } from "node:test";
import { readClipboard, isClipboardField } from "../draw/clipboard";
import { serializeDocument } from "../draw/document";
import { toSvg } from "../draw/svg";
import { DEFAULT_STYLE, type Shape } from "../draw/types";
import { BOARD_TEMPLATES } from "../draw/templates";

test("clipboard distinguishes editable diagrams, ordinary text and unsupported content", () => {
    const shapes = BOARD_TEMPLATES[0]!.shapes;
    assert.deepEqual(readClipboard(serializeDocument(shapes)), shapes);
    assert.deepEqual(readClipboard("  \n"), []);
    const pasted = readClipboard("Hello\r\nworld")[0]!;
    assert.equal(pasted.type, "text");
    if (pasted.type === "text") assert.equal(pasted.text, "Hello\nworld");
    assert.throws(() => readClipboard("x".repeat(2001)), /2,000/);
    assert.throws(() => readClipboard(JSON.stringify({ type: "exciladraw", version: 99, shapes })), /version/);
    assert.throws(() => readClipboard("x".repeat(5 * 1024 * 1024 + 1)), /too large/);
    assert.equal(isClipboardField({ isContentEditable: true } as unknown as EventTarget), true);
    assert.equal(isClipboardField({ closest: () => ({}) } as unknown as EventTarget), true);
    assert.equal(isClipboardField(null), false);
});

test("SVG exports every shape, escapes labels and preserves line and fill styling", () => {
    const style = { ...DEFAULT_STYLE, strokeStyle: "dashed" as const, opacity: 50, edges: "round" as const, fillColor: "#453113" };
    const shapes: Shape[] = [
        { id: "r", type: "rect", x: 100, y: 80, width: -60, height: -40, style },
        { id: "d", type: "diamond", x: 0, y: 0, width: 20, height: 30 },
        { id: "c", type: "circle", centerX: 0, centerY: 0, radiusX: -10, radiusY: 15 },
        { id: "l", type: "line", startX: 0, startY: 0, endX: 50, endY: 40 },
        { id: "a", type: "arrow", startX: 0, startY: 0, endX: 100, endY: 100, style },
        { id: "p", type: "pencil", points: [{ x: 0, y: 0 }, { x: 10, y: 20 }, { x: 30, y: 40 }], style },
        { id: "t", type: "text", x: 0, y: 0, text: '<script>& "\u0001\nsecond line', fontSize: 20 },
    ];
    const before = structuredClone(shapes);
    const svg = toSvg(shapes, { fontFamily: '"Test Font", sans-serif', measureText: () => 1000 })!;
    assert.match(svg, /<rect x="40" y="40" width="60" height="40" rx="10"/);
    assert.match(svg, /<polygon/);
    assert.match(svg, /rx="10" ry="15"/);
    assert.match(svg, /stroke-dasharray="8 8"/);
    assert.match(svg, /opacity="0.5"/);
    assert.match(svg, /Q 10 20 20 30 L 30 40/);
    assert.match(svg, /&lt;script&gt;&amp; &quot;/);
    assert.match(svg, /font-family="&quot;Test Font&quot;, sans-serif"/);
    assert.match(svg, /<tspan x="0" y="25">second line<\/tspan>/);
    assert.ok(!svg.includes("<script>") && !svg.includes("\u0001"));
    assert.match(svg, /width="1082"/); // measured text plus leftmost ellipse and padding
    assert.deepEqual(shapes, before);
    assert.equal(toSvg([]), null);
});
