import { DEFAULT_STYLE, type Shape, type ShapeStyle } from "./types";

export type BoardTemplate = { id: string; name: string; description: string; category: string; shapes: Shape[] };
const blue = { ...DEFAULT_STYLE, strokeColor: "#60a5fa", fillColor: "#1e3252", edges: "round" } satisfies ShapeStyle;
const amber = { ...blue, strokeColor: "#fbbf24", fillColor: "#453113" };
const green = { ...blue, strokeColor: "#4ade80", fillColor: "#1f3a2c" };
function box(id: string, x: number, y: number, width: number, height: number, style = blue): Shape {
    return { id, type: "rect", x, y, width, height, style };
}
function label(id: string, x: number, y: number, text: string, fontSize = 20): Shape {
    return { id, type: "text", x, y, text, fontSize, style: DEFAULT_STYLE };
}
function arrow(id: string, startX: number, startY: number, endX: number, endY: number): Shape {
    return { id, type: "arrow", startX, startY, endX, endY, style: DEFAULT_STYLE };
}

/** Original starter diagrams, made from the same editable shapes as the canvas. */
export const BOARD_TEMPLATES: BoardTemplate[] = [
    {
        id: "flowchart", name: "Decision flow", category: "Planning",
        description: "Map a process with a decision and two outcomes.",
        shapes: [
            box("start", 230, 0, 180, 64), label("start-label", 286, 20, "Start"),
            arrow("a1", 320, 72, 320, 126),
            { id: "decision", type: "diamond", x: 220, y: 140, width: 200, height: 120, style: amber },
            label("decision-label", 276, 188, "Ready?"),
            arrow("a2", 220, 200, 100, 200), arrow("a3", 420, 200, 540, 200),
            label("no", 146, 170, "No", 16), label("yes", 460, 170, "Yes", 16),
            box("review", -80, 168, 180, 64, amber), label("review-label", -28, 188, "Review"),
            box("ship", 540, 168, 180, 64, green), label("ship-label", 598, 188, "Ship"),
        ],
    },
    {
        id: "kanban", name: "Project board", category: "Planning",
        description: "Organize the next steps into three simple stages.",
        shapes: [
            ...["To do", "In progress", "Done"].flatMap((title, i) => [
                box(`column-${i}`, i * 260, 0, 240, 340, { ...blue, fillColor: "transparent" }),
                label(`heading-${i}`, i * 260 + 20, 20, title),
            ]),
            box("task1", 16, 76, 208, 86, amber), label("task1-label", 30, 92, "Define the scope", 18),
            box("task2", 16, 184, 208, 86, amber), label("task2-label", 30, 200, "Gather feedback", 18),
            box("task3", 276, 76, 208, 86), label("task3-label", 290, 92, "Build a prototype", 18),
            box("task4", 536, 76, 208, 86, green), label("task4-label", 550, 92, "Kickoff", 18),
        ],
    },
    {
        id: "architecture", name: "System architecture", category: "Engineering",
        description: "Sketch a client, an API, and its data services.",
        shapes: [
            box("client", 0, 120, 180, 90), label("client-label", 42, 152, "Web client"),
            box("api", 290, 120, 180, 90, amber), label("api-label", 326, 152, "API service"),
            box("db", 590, 20, 180, 90, green), label("db-label", 636, 52, "Database"),
            box("cache", 590, 240, 180, 90, green), label("cache-label", 648, 272, "Cache"),
            arrow("request", 188, 165, 282, 165),
            arrow("query", 478, 148, 582, 65), arrow("lookup", 478, 182, 582, 285),
            label("https", 204, 134, "HTTPS", 14),
        ],
    },
    {
        id: "retrospective", name: "Team retrospective", category: "Workshops",
        description: "Reflect together and turn observations into actions.",
        shapes: [
            ...["Went well", "Could improve", "Try next"].flatMap((title, i) => [
                box(`area-${i}`, i * 280, 0, 256, 300, [green, amber, blue][i]!),
                label(`title-${i}`, i * 280 + 20, 22, title),
                label(`prompt-${i}`, i * 280 + 20, 78, ["Celebrate a win", "Name a challenge", "Pick one action"][i]!, 18),
            ]),
        ],
    },
];
