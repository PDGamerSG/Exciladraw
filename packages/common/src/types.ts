import {z} from "zod";

// the sign in / sign up form collects an email address, and it is stored as
// the user's email — a 20 character cap rejected most real addresses
const email = z.email().max(255);
const password = z.string().min(6).max(100);

export const CreateUserSchema = z.object({
    username: email,
    password,
    name: z.string().min(1).max(50)
})

export const SigninSchema = z.object({
    username: email,
    password: z.string()
})

export const CreateRoomSchema = z.object({
    name: z.string().trim().min(3).max(20)
})

export const JoinRoomSchema = z.object({
    inviteCode: z.string().min(1).max(64)
})

/* ── shapes ──────────────────────────────────────────────────────────────
   the websocket server persists whatever the client draws, so the shape is
   validated here rather than trusted. both ends import these schemas, which
   keeps the wire format and the renderer from drifting apart. */

const hexColor = z.string().regex(/^(transparent|#[0-9a-fA-F]{3,8})$/);

export const ShapeStyleSchema = z.object({
    strokeColor: hexColor,
    fillColor: hexColor,
    strokeWidth: z.number().min(0).max(64),
    strokeStyle: z.enum(["solid", "dashed", "dotted"]),
    edges: z.enum(["sharp", "round"]),
    opacity: z.number().min(0).max(100)
});

const finite = z.number().finite();
const point = z.object({ x: finite, y: finite });
const base = { id: z.string().min(1).max(64), style: ShapeStyleSchema.optional() };
const box = { x: finite, y: finite, width: finite, height: finite };
const segment = { startX: finite, startY: finite, endX: finite, endY: finite };

export const ShapeSchema = z.discriminatedUnion("type", [
    z.object({ type: z.literal("rect"), ...base, ...box }),
    z.object({ type: z.literal("diamond"), ...base, ...box }),
    z.object({
        type: z.literal("circle"), ...base,
        centerX: finite, centerY: finite, radiusX: finite, radiusY: finite
    }),
    z.object({ type: z.literal("line"), ...base, ...segment }),
    z.object({ type: z.literal("arrow"), ...base, ...segment }),
    z.object({ type: z.literal("text"), ...base, x: finite, y: finite, text: z.string().max(2000), fontSize: finite }),
    // a stroke is capped so one runaway drag cannot store an unbounded blob
    z.object({ type: z.literal("pencil"), ...base, points: z.array(point).min(2).max(5000) })
]);

export type Shape = z.infer<typeof ShapeSchema>;
export type ShapeStyle = z.infer<typeof ShapeStyleSchema>;

/* ── websocket protocol ─────────────────────────────────────────────────── */

const roomId = z.union([z.string(), z.number()]).transform(String);

export const ClientMessageSchema = z.discriminatedUnion("type", [
    z.object({ type: z.literal("join_room"), roomId }),
    z.object({ type: z.literal("leave_room"), roomId }),
    z.object({ type: z.literal("draw"), roomId, shape: ShapeSchema }),
    z.object({ type: z.literal("erase"), roomId, shapeIds: z.array(z.string().max(64)).min(1).max(200) }),
    z.object({ type: z.literal("cursor"), roomId, x: finite, y: finite })
]);

export type ClientMessage = z.infer<typeof ClientMessageSchema>;
