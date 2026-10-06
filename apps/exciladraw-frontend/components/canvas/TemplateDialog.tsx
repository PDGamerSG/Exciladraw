"use client";

import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { BOARD_TEMPLATES, type BoardTemplate } from "@/draw/templates";
import { boundsOf } from "@/draw/geometry";
import { BOARD_BACKGROUND, drawShape } from "@/draw/render";

function TemplatePreview({ template }: { template: BoardTemplate }) {
    const ref = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const canvas = ref.current;
        const ctx = canvas?.getContext("2d");
        const bounds = boundsOf(template.shapes);
        if (!canvas || !ctx || !bounds) return;
        ctx.fillStyle = BOARD_BACKGROUND;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const scale = Math.min(560 / (bounds.maxX - bounds.minX), 220 / (bounds.maxY - bounds.minY));
        ctx.setTransform(scale, 0, 0, scale,
            300 - (bounds.minX + bounds.maxX) * scale / 2,
            130 - (bounds.minY + bounds.maxY) * scale / 2);
        for (const shape of template.shapes) drawShape(ctx, shape);
    }, [template]);
    return <canvas ref={ref} width={600} height={260} aria-hidden className="w-full rounded-lg" />;
}

export function TemplateDialog({ open, onClose, onInsert }: {
    open: boolean; onClose: () => void; onInsert: (template: BoardTemplate) => void;
}) {
    const [query, setQuery] = useState("");
    const templates = BOARD_TEMPLATES.filter((template) =>
        `${template.name} ${template.description} ${template.category}`.toLowerCase().includes(query.trim().toLowerCase()));
    return (
        <Modal open={open} onClose={onClose} title="Start with a template"
            description="Editable starting points for your next idea. Insert into this board, then make it yours."
            className="max-h-[calc(100dvh-2rem)] max-w-2xl overflow-y-auto">
            <div className="relative mb-4">
                <Search aria-hidden className="absolute left-3 top-3 h-4 w-4 text-chalk-500" />
                <input type="search" aria-label="Search templates" value={query} onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search templates…" className="h-10 w-full rounded-lg border border-ink-700 bg-ink-900 pl-9 pr-3 text-sm text-chalk-100 outline-none focus:border-amber-400" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
                {templates.map((template) => (
                    <button key={template.id} type="button" onClick={() => onInsert(template)} aria-label={`Insert ${template.name}`}
                        className="rounded-xl border border-ink-700 p-3 text-left transition-colors hover:border-amber-400 focus-visible:outline-2 focus-visible:outline-amber-400">
                        <TemplatePreview template={template} />
                        <div className="mt-3 text-[11px] text-amber-400">{template.category}</div>
                        <h3 className="mt-1 text-sm font-medium text-chalk-100">{template.name}</h3>
                        <p className="mt-1 text-xs leading-relaxed text-chalk-300">{template.description}</p>
                    </button>
                ))}
            </div>
            {!templates.length && <p role="status" className="py-8 text-center text-sm text-chalk-300">No templates match “{query}”. Try “planning” or “engineering”.</p>}
            <p className="mt-4 text-xs leading-relaxed text-chalk-500">Adds shapes without replacing your work. Undo removes the entire insert.</p>
        </Modal>
    );
}
