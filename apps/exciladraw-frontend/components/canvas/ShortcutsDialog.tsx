"use client";

import { Modal } from "@/components/ui/modal";
import { TOOLS } from "./Toolbar";

const EDITING: [string, string][] = [
    ["Undo", "Ctrl Z"],
    ["Redo", "Ctrl ⇧ Z"],
    ["Select everything", "Ctrl A"],
    ["Duplicate selection", "Ctrl D"],
    ["Delete selection", "Delete"],
    ["Nudge selection", "Arrows"],
    ["Nudge further", "⇧ Arrows"],
    ["Square off / snap angle", "Hold ⇧ while drawing"],
];

const VIEW: [string, string][] = [
    ["Pan the board", "Space drag · scroll"],
    ["Zoom", "Ctrl scroll"],
    ["Zoom in / out", "Ctrl + · Ctrl −"],
    ["Reset zoom", "Ctrl 0"],
    ["Fit drawing to screen", "⇧ 1"],
    ["Edit a label", "Double-click it"],
];

function Row({ label, keys }: { label: string; keys: string }) {
    return (
        <div className="flex items-baseline justify-between gap-4 py-1.5">
            <span className="text-[13px] text-chalk-300">{label}</span>
            <kbd className="shrink-0 font-mono text-[11px] text-chalk-500">{keys}</kbd>
        </div>
    );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section>
            <h3 className="eyebrow mb-1 border-b border-ink-700 pb-2">{title}</h3>
            <div className="divide-y divide-ink-800">{children}</div>
        </section>
    );
}

export function ShortcutsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Keyboard shortcuts"
            className="max-w-2xl"
        >
            <div className="grid max-h-[70vh] gap-6 overflow-y-auto pr-1 sm:grid-cols-2">
                <Group title="Tools">
                    {TOOLS.map(({ label, digit, letter }) => (
                        <Row key={label} label={label} keys={`${letter} · ${digit}`} />
                    ))}
                </Group>
                <div className="flex flex-col gap-6">
                    <Group title="Editing">
                        {EDITING.map(([label, keys]) => (
                            <Row key={label} label={label} keys={keys} />
                        ))}
                    </Group>
                    <Group title="Getting around">
                        {VIEW.map(([label, keys]) => (
                            <Row key={label} label={label} keys={keys} />
                        ))}
                    </Group>
                </div>
            </div>
        </Modal>
    );
}
