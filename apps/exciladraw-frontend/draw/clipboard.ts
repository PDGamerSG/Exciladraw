import { MAX_DOCUMENT_BYTES, parseDocument } from "./document";
import { DEFAULT_STYLE, newShapeId, type Shape } from "./types";

/** Native text clipboard data works across tabs without clipboard permissions. */
export function readClipboard(text: string): Shape[] {
    if (!text.trim()) return [];
    if (new TextEncoder().encode(text).length > MAX_DOCUMENT_BYTES) {
        throw new Error("Clipboard content is too large. Paste up to 5 MB of shapes or 2,000 characters of text.");
    }
    let data: unknown;
    try { data = JSON.parse(text); } catch { /* Ordinary text is a new label. */ }
    if (data && typeof data === "object" && "type" in data && data.type === "exciladraw") {
        return parseDocument(text);
    }
    if (text.length > 2000) throw new Error("Text is too long. Paste up to 2,000 characters at a time.");
    return [{ type: "text", id: newShapeId(), x: 0, y: 0,
        text: text.replace(/\r\n?/g, "\n"), fontSize: 20, style: { ...DEFAULT_STYLE } }];
}

export function isClipboardField(target: EventTarget | null): boolean {
    const element = target as HTMLElement | null;
    return !!(element?.isContentEditable || element?.closest?.('input, textarea, select, [role="dialog"], [role="menu"]'));
}
