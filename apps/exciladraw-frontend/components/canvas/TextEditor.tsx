"use client";

import { useCallback, useEffect, useRef } from "react";
import type { TextEditRequest } from "@/draw/Board";

/**
 * The caret for the text tool. A textarea is floated over the canvas at the
 * point that was clicked, so typing happens in a real text field — with the
 * platform's own IME, selection and spellcheck — and only the finished string
 * is handed back to the board.
 */
export function TextEditor({
    request,
    onCommit,
    onCancel,
}: {
    request: TextEditRequest;
    onCommit: (value: string) => void;
    onCancel: () => void;
}) {
    const ref = useRef<HTMLTextAreaElement>(null);
    const committed = useRef(false);
    const { fontSize } = request;

    const resize = useCallback(
        (el: HTMLTextAreaElement) => {
            el.style.height = "auto";
            el.style.height = `${el.scrollHeight}px`;
            el.style.width = "auto";
            el.style.width = `${Math.max(el.scrollWidth, fontSize * 2)}px`;
        },
        [fontSize]
    );

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        el.focus();
        el.setSelectionRange(el.value.length, el.value.length);
        resize(el);
    }, [request, resize]);

    function commit(value: string) {
        if (committed.current) return;
        committed.current = true;
        onCommit(value);
    }

    return (
        <textarea
            ref={ref}
            defaultValue={request.value}
            spellCheck={false}
            aria-label="Type a label"
            onInput={(e) => resize(e.currentTarget)}
            onBlur={(e) => commit(e.currentTarget.value)}
            onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === "Escape") {
                    e.preventDefault();
                    committed.current = true;
                    onCancel();
                    return;
                }
                // enter adds a line; the note is finished with the modifier or
                // by clicking away, the way a sticky-note editor behaves
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    commit(e.currentTarget.value);
                }
            }}
            style={{
                left: request.left,
                top: request.top,
                fontSize: `${request.fontSize}px`,
                lineHeight: 1.25,
                color: request.color,
                caretColor: request.color,
            }}
            className="pointer-events-auto absolute z-20 min-w-8 resize-none overflow-hidden whitespace-pre border-none bg-transparent p-0 font-sans outline-none"
        />
    );
}
