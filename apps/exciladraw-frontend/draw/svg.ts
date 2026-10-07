import { boundsOf, shapeBounds } from "./geometry";
import { DEFAULT_STYLE, type Shape } from "./types";

/** Escape text/attributes, including invalid XML control characters. */
function xml(value: string) {
    return Array.from(value).filter((char) => {
        const code = char.codePointAt(0)!;
        return code === 9 || code === 10 || code === 13 || (code >= 32 && code <= 0xd7ff)
            || (code >= 0xe000 && code <= 0xfffd) || code >= 0x10000;
    }).join("").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

export function toSvg(shapes: Shape[], options: {
    fontFamily?: string;
    measureText?: (text: string, size: number) => number;
} = {}): string | null {
    const bounds = boundsOf(shapes);
    if (!bounds) return null;
    let padding = 32;
    for (const shape of shapes) {
        padding = Math.max(padding, 32 + (shape.style?.strokeWidth ?? 2) * 2);
        if (shape.type === "text" && options.measureText) {
            bounds.maxX = Math.max(bounds.maxX, shape.x + options.measureText(shape.text, shape.fontSize));
        }
    }
    const x = bounds.minX - padding, y = bounds.minY - padding;
    const width = Math.max(1, bounds.maxX - bounds.minX + padding * 2);
    const height = Math.max(1, bounds.maxY - bounds.minY + padding * 2);
    const elements = shapes.map((shape) => {
        const style = { ...DEFAULT_STYLE, ...shape.style };
        const w = Math.max(1, style.strokeWidth);
        const dash = style.strokeStyle === "dashed" ? `${w * 4} ${w * 4}` : style.strokeStyle === "dotted" ? `${w * 0.5} ${w * 3}` : "none";
        const attrs = `stroke="${xml(style.strokeColor)}" stroke-width="${style.strokeWidth}" stroke-dasharray="${dash}" stroke-linecap="round" stroke-linejoin="round" fill="${xml(style.fillColor === "transparent" ? "none" : style.fillColor)}"`;
        let element: string;
        switch (shape.type) {
            case "rect": {
                const b = shapeBounds(shape);
                const radius = style.edges === "round" ? Math.min(32, Math.abs(shape.width) / 4, Math.abs(shape.height) / 4) : 0;
                element = `<rect x="${b.minX}" y="${b.minY}" width="${Math.abs(shape.width)}" height="${Math.abs(shape.height)}" rx="${radius}" ${attrs}/>`;
                break;
            }
            case "diamond":
                element = `<polygon points="${shape.x + shape.width / 2},${shape.y} ${shape.x + shape.width},${shape.y + shape.height / 2} ${shape.x + shape.width / 2},${shape.y + shape.height} ${shape.x},${shape.y + shape.height / 2}" ${attrs}/>`;
                break;
            case "circle":
                element = `<ellipse cx="${shape.centerX}" cy="${shape.centerY}" rx="${Math.abs(shape.radiusX)}" ry="${Math.abs(shape.radiusY)}" ${attrs}/>`;
                break;
            case "line":
            case "arrow": {
                element = `<path d="M ${shape.startX} ${shape.startY} L ${shape.endX} ${shape.endY}" ${attrs}/>`;
                if (shape.type === "arrow") {
                    const angle = Math.atan2(shape.endY - shape.startY, shape.endX - shape.startX);
                    const length = Math.min(18 + style.strokeWidth * 2, Math.max(6, Math.hypot(shape.endX - shape.startX, shape.endY - shape.startY) * 0.4));
                    const head = [-1, 1].map((sign) => `M ${shape.endX} ${shape.endY} L ${shape.endX - length * Math.cos(angle + sign * Math.PI / 7)} ${shape.endY - length * Math.sin(angle + sign * Math.PI / 7)}`).join(" ");
                    element += `<path d="${head}" stroke="${xml(style.strokeColor)}" stroke-width="${style.strokeWidth}" stroke-linecap="round" fill="none"/>`;
                }
                break;
            }
            case "pencil": {
                const first = shape.points[0];
                let path = first ? `M ${first.x} ${first.y}` : "";
                for (let i = 1; i < shape.points.length - 1; i++) {
                    const current = shape.points[i]!, next = shape.points[i + 1]!;
                    path += ` Q ${current.x} ${current.y} ${(current.x + next.x) / 2} ${(current.y + next.y) / 2}`;
                }
                const last = shape.points[shape.points.length - 1];
                if (last) path += ` L ${last.x} ${last.y}`;
                element = `<path d="${path}" ${attrs.replace(/fill="[^"]*"/, 'fill="none"')}/>`;
                break;
            }
            case "text":
                element = `<text fill="${xml(style.strokeColor)}" font-family="${xml(options.fontFamily || "sans-serif")}" font-size="${shape.fontSize}" dominant-baseline="text-before-edge" xml:space="preserve">${shape.text.split("\n").map((line, i) => `<tspan x="${shape.x}" y="${shape.y + i * shape.fontSize * 1.25}">${xml(line)}</tspan>`).join("")}</text>`;
                break;
        }
        return `<g opacity="${style.opacity / 100}">${element}</g>`;
    });
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${x} ${y} ${width} ${height}"><rect x="${x}" y="${y}" width="${width}" height="${height}" fill="#121212"/>${elements.join("")}</svg>`;
}
