import assert from "node:assert/strict";
import { test } from "node:test";
import { drawShape } from "../draw/render";
import { toSvg } from "../draw/svg";
import { BOARD_TEMPLATES } from "../draw/templates";
import { DEFAULT_STYLE, type Shape } from "../draw/types";

test("light canvas and SVG share readable inks while preserving source styles and custom colours", () => {
    const shapes: Shape[] = [
        ...BOARD_TEMPLATES.flatMap((template) => template.shapes),
        { id: "default", type: "text", text: "Legacy label", x: 0, y: 0, fontSize: 20 },
        { id: "custom", type: "rect", x: 0, y: 0, width: 20, height: 20, style: { ...DEFAULT_STYLE, strokeColor: "#112233", fillColor: "#abcdef" } },
    ];
    const before = JSON.stringify(shapes);
    const painted: string[] = [];
    const context = new Proxy({} as CanvasRenderingContext2D, {
        get: () => () => {},
        set: (_target, key, value) => {
            if (key === "fillStyle" || key === "strokeStyle") painted.push(value);
            return true;
        },
    });
    for (const shape of shapes) drawShape(context, shape, "light");
    const svg = toSvg(shapes, { theme: "light" })!;
    for (const ink of ["#303431", "#326baf", "#dce8f5", "#956514", "#f4e8c9", "#28704b", "#deeddf", "#112233", "#abcdef"]) {
        assert.ok(painted.includes(ink), `canvas paints ${ink}`);
        assert.ok(svg.includes(ink), `SVG exports ${ink}`);
    }
    assert.ok(svg.includes('fill="#faf9f6"'));
    assert.ok(!svg.includes('stroke="#e3e3e8"'));
    const dark = toSvg(shapes, { theme: "dark" })!;
    assert.ok(dark.includes('stroke="#60a5fa"') && dark.includes('fill="#1e3252"'));
    assert.equal(JSON.stringify(shapes), before, "theme rendering and export never mutate the document");
});
