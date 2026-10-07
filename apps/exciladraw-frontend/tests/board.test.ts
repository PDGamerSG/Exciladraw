import assert from "node:assert/strict";
import { test } from "node:test";
import { ClientMessageSchema } from "@repo/common/types";
import { Board } from "../draw/Board";
import { api } from "../lib/api";
import { parseDocument } from "../draw/document";
import { BOARD_TEMPLATES } from "../draw/templates";
import type { Shape } from "../draw/types";

class Socket extends EventTarget {
    readyState = 1;
    sent: string[] = [];
    send(value: string) { this.sent.push(value); }
}
class CanvasStub extends EventTarget {
    style = {};
    getContext() { return {}; }
}

test("board inserts, syncs, arranges and undoes a large diagram as whole operations", async () => {
    const originalWindow = globalThis.window;
    const originalComputedStyle = globalThis.getComputedStyle;
    const originalRaf = globalThis.requestAnimationFrame;
    const originalCancel = globalThis.cancelAnimationFrame;
    const originalAdapter = api.defaults.adapter;
    Object.assign(globalThis, {
        window: new EventTarget(), getComputedStyle: () => ({ fontFamily: "sans-serif" }),
        requestAnimationFrame: () => 1, cancelAnimationFrame: () => {},
    });
    const existing: Shape = { type: "rect", id: "existing", x: 0, y: 0, width: 40, height: 40 };
    api.defaults.adapter = async (config) => ({ data: { messages: [{ id: 1, shapeId: existing.id, message: JSON.stringify({ shape: existing }) }] }, status: 200, statusText: "OK", headers: {}, config });
    const socket = new Socket();
    const peerSocket = new Socket();
    const notices: { message: string; error: boolean }[] = [];
    let board!: Board, peer!: Board;
    try {
        await new Promise<void>((resolve) => {
            board = new Board(new CanvasStub() as unknown as HTMLCanvasElement, "1", socket as unknown as WebSocket, {
                onLoad: () => resolve(), onNotice: (message, error) => notices.push({ message, error }),
            });
            assert.throws(() => board.insertShapes(BOARD_TEMPLATES[0]!.shapes), /finish loading/);
        });
        await new Promise<void>((resolve) => {
            peer = new Board(new CanvasStub() as unknown as HTMLCanvasElement, "1", peerSocket as unknown as WebSocket, { onLoad: () => resolve() });
        });
        board.resize(1200, 800, 1);
        const relay = () => {
            for (const frame of socket.sent.splice(0)) {
                assert.ok(ClientMessageSchema.safeParse(JSON.parse(frame)).success, "every frame matches the server schema");
                assert.ok(new TextEncoder().encode(frame).length < 1024 * 1024);
                peerSocket.dispatchEvent(new MessageEvent("message", { data: frame }));
            }
            assert.deepEqual(parseDocument(peer.toDocument()), parseDocument(board.toDocument()));
        };
        board.insertShapes(Array.from({ length: 401 }, (_, i) => ({ type: "rect", id: `r${i}`, x: i * 10, y: i * 3, width: 20, height: 20 })));
        assert.equal(parseDocument(board.toDocument()).length, 402);
        assert.equal(parseDocument(board.toDocument(true)).length, 401);
        relay();
        const inserted = board.toDocument();
        const cameraBeforeTheme = board.getCamera();
        board.setTheme("light");
        assert.equal(board.toDocument(), inserted, "appearance must not rewrite saved shapes");
        assert.equal(parseDocument(board.toDocument(true)).length, 401, "selection survives appearance changes");
        assert.deepEqual(board.getCamera(), cameraBeforeTheme);
        assert.equal(socket.sent.length, 0, "appearance is local to each collaborator");
        assert.match(board.toSvg()!, /fill="#faf9f6"/);
        board.setTheme("dark");
        assert.match(board.toSvg()!, /fill="#121212"/);
        board.arrangeSelection("top");
        assert.equal(socket.sent.length, 3, "large updates are split into protocol-sized frames");
        relay();
        board.undo();
        assert.equal(board.toDocument(), inserted);
        relay();
        board.undo();
        assert.equal(socket.sent.length, 3, "large undo erases are split into valid frames");
        assert.deepEqual(parseDocument(board.toDocument()), [existing]);
        relay();
        board.redo();
        assert.equal(board.toDocument(), inserted);
        relay();
        board.insertShapes(BOARD_TEMPLATES[0]!.shapes);
        board.insertShapes(BOARD_TEMPLATES[0]!.shapes);
        const repeated = parseDocument(board.toDocument());
        assert.equal(new Set(repeated.map((shape) => shape.id)).size, repeated.length);
        relay();
        board.insertShapes(Array.from({ length: 6 }, (_, i) => ({ type: "pencil", id: `stroke-${i}`,
            points: Array.from({ length: 5000 }, (_, j) => ({ x: i + j / 12345, y: j / 23456 })) })));
        relay();
        board.setStyle({ opacity: 75 });
        assert.ok(socket.sent.length > 1, "large freehand updates split by bytes even with fewer than 200 shapes");
        relay();
        socket.readyState = 3;
        assert.throws(() => board.insertShapes(BOARD_TEMPLATES[0]!.shapes), /Reconnect/);
        socket.readyState = 1;
        peer.destroy(); // Each browser window has one live board listening for clipboard events.
        board.insertShapes(BOARD_TEMPLATES[0]!.shapes);
        const beforeClipboard = board.toDocument();
        let copied = "";
        const clipboard = (type: string, text = copied, failWrite = false, field = false) => {
            const event = new Event(type, { cancelable: true });
            Object.defineProperty(event, "clipboardData", { value: {
                files: [], getData: () => text,
                setData: (_type: string, value: string) => { if (failWrite) throw new Error("Clipboard unavailable"); copied = value; },
            } });
            if (field) Object.defineProperty(event, "target", { value: { isContentEditable: true } });
            window.dispatchEvent(event);
            return event;
        };
        assert.equal(clipboard("copy").defaultPrevented, true);
        assert.equal(parseDocument(copied).length, BOARD_TEMPLATES[0]!.shapes.length);
        clipboard("cut", "", true);
        assert.equal(board.toDocument(), beforeClipboard, "failed clipboard write must not delete shapes");
        assert.equal(notices.at(-1)?.error, true);
        socket.readyState = 3;
        clipboard("cut");
        assert.equal(board.toDocument(), beforeClipboard, "offline cut must not delete shapes");
        socket.readyState = 1;
        clipboard("cut");
        assert.equal(parseDocument(board.toDocument()).length, parseDocument(beforeClipboard).length - BOARD_TEMPLATES[0]!.shapes.length);
        board.undo();
        assert.equal(board.toDocument(), beforeClipboard);
        clipboard("paste");
        const pasted = parseDocument(board.toDocument(true));
        const sourceIds = new Set(parseDocument(copied).map((shape) => shape.id));
        assert.ok(pasted.every((shape) => !sourceIds.has(shape.id)));
        board.undo();
        assert.equal(board.toDocument(), beforeClipboard);
        clipboard("paste", "A new label\nSecond line");
        const label = parseDocument(board.toDocument(true))[0]!;
        assert.equal(label.type, "text");
        if (label.type === "text") assert.equal(label.text, "A new label\nSecond line");
        board.undo();
        assert.equal(clipboard("paste", "Native field content", false, true).defaultPrevented, false);
        clipboard("paste", JSON.stringify({ type: "exciladraw", version: 999 }));
        assert.equal(board.toDocument(), beforeClipboard, "invalid clipboard diagrams leave the board intact");
        assert.equal(notices.at(-1)?.error, true);
    } finally {
        board?.destroy();
        peer?.destroy();
        api.defaults.adapter = originalAdapter;
        Object.assign(globalThis, { window: originalWindow, getComputedStyle: originalComputedStyle, requestAnimationFrame: originalRaf, cancelAnimationFrame: originalCancel });
    }
});
