import { api } from "@/lib/api";
import { newShapeId, type Shape } from "./types";

type ChatRow = { id: number; shapeId: string | null; message: string };

/**
 * Replays a room's stored strokes. Rows are the source of truth for a shape's
 * id: shapes drawn before ids existed carry one on the row instead of inside
 * their JSON, so reading it from there keeps old boards fully editable.
 */
export async function getExistingShapes(roomId: string): Promise<Shape[]> {
    const res = await api.get<{ messages: ChatRow[] }>(`/chats/${roomId}`);
    const messages = res.data.messages ?? [];

    const shapes: Shape[] = [];
    const seen = new Set<string>();

    for (const row of messages) {
        let shape: Shape | undefined;
        try {
            shape = JSON.parse(row.message)?.shape;
        } catch {
            // one unparseable row shouldn't blank the whole board
            continue;
        }
        if (!shape || typeof shape !== "object" || !("type" in shape)) continue;

        const id = shape.id || row.shapeId || newShapeId();
        // a shape re-sent after a reconnect can appear twice; the later row wins
        if (seen.has(id)) {
            const index = shapes.findIndex((s) => s.id === id);
            if (index !== -1) shapes.splice(index, 1);
        }
        seen.add(id);
        shapes.push({ ...shape, id });
    }

    return shapes;
}
