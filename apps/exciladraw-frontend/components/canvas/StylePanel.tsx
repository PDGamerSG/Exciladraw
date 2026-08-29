"use client";

import { cn } from "@/lib/utils";
import type { ShapeStyle } from "@/draw/types";

export type PanelState = ShapeStyle;

/** The pen tray. These are the inks the board draws with. */
const STROKE_COLORS = [
    { value: "#e3e7f0", name: "Graphite" },
    { value: "#ff6b6b", name: "Red" },
    { value: "#4ade80", name: "Green" },
    { value: "#60a5fa", name: "Blue" },
    { value: "#fbbf24", name: "Amber" },
    { value: "#a78bfa", name: "Violet" },
];

const FILL_COLORS = [
    { value: "transparent", name: "None" },
    { value: "#4a2632", name: "Red" },
    { value: "#1f3a2c", name: "Green" },
    { value: "#1e3252", name: "Blue" },
    { value: "#453113", name: "Amber" },
    { value: "#332a52", name: "Violet" },
];

const STROKE_WIDTHS = [
    { value: 1, name: "Thin" },
    { value: 2, name: "Medium" },
    { value: 4, name: "Bold" },
];

const STROKE_STYLES = [
    { value: "solid", name: "Solid", dash: "" },
    { value: "dashed", name: "Dashed", dash: "7 5" },
    { value: "dotted", name: "Dotted", dash: "1.5 5" },
] as const;

const EDGES = [
    { value: "sharp", name: "Sharp" },
    { value: "round", name: "Round" },
] as const;

const OPACITIES = [25, 50, 75, 100];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <div className="eyebrow mb-2">{label}</div>
            <div className="flex items-center gap-1.5">{children}</div>
        </div>
    );
}

function Swatch({
    color,
    name,
    selected,
    onClick,
}: {
    color: string;
    name: string;
    selected: boolean;
    onClick: () => void;
}) {
    const isNone = color === "transparent";
    return (
        <button
            type="button"
            onClick={onClick}
            title={name}
            aria-label={name}
            aria-pressed={selected}
            className={cn(
                "relative h-6 w-6 rounded-md border transition-transform duration-150",
                "border-white/10 hover:scale-110",
                selected && "scale-110 border-amber-400 ring-2 ring-amber-400/35"
            )}
            style={isNone ? undefined : { backgroundColor: color }}
        >
            {isNone && (
                // a diagonal rule reads as "no fill" faster than a checkerboard
                <svg viewBox="0 0 24 24" className="h-full w-full" aria-hidden>
                    <line x1="4" y1="20" x2="20" y2="4" stroke="var(--chalk-500)" strokeWidth="1.5" />
                </svg>
            )}
        </button>
    );
}

function Choice({
    selected,
    onClick,
    label,
    children,
}: {
    selected: boolean;
    onClick: () => void;
    label: string;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={label}
            aria-label={label}
            aria-pressed={selected}
            className={cn(
                "flex h-7 w-9 items-center justify-center rounded-md border transition-colors duration-150",
                "border-transparent bg-ink-800 text-chalk-300 hover:bg-ink-750 hover:text-chalk-100",
                selected && "border-amber-400/45 bg-amber-400/12 text-amber-300"
            )}
        >
            {children}
        </button>
    );
}

export function StylePanel({
    state,
    setState,
    /** Shown when the panel is editing a selection rather than the next shape. */
    editingCount = 0,
}: {
    state: PanelState;
    setState: (s: Partial<PanelState>) => void;
    editingCount?: number;
}) {
    return (
        <section
            aria-label="Shape styles"
            className="panel pointer-events-auto flex w-[218px] flex-col gap-4 rounded-xl p-3.5"
        >
            <header className="flex items-baseline justify-between">
                <h2 className="font-display text-[13px] font-semibold tracking-tight text-chalk-100">
                    {editingCount > 0 ? "Selection" : "Next shape"}
                </h2>
                {editingCount > 0 && (
                    <span className="font-mono text-[10px] text-chalk-500">
                        {editingCount} selected
                    </span>
                )}
            </header>

            <Field label="Stroke">
                {STROKE_COLORS.map(({ value, name }) => (
                    <Swatch
                        key={value}
                        color={value}
                        name={name}
                        selected={state.strokeColor === value}
                        onClick={() => setState({ strokeColor: value })}
                    />
                ))}
            </Field>

            <Field label="Fill">
                {FILL_COLORS.map(({ value, name }) => (
                    <Swatch
                        key={value}
                        color={value}
                        name={name}
                        selected={state.fillColor === value}
                        onClick={() => setState({ fillColor: value })}
                    />
                ))}
            </Field>

            <Field label="Width">
                {STROKE_WIDTHS.map(({ value, name }) => (
                    <Choice
                        key={value}
                        label={name}
                        selected={state.strokeWidth === value}
                        onClick={() => setState({ strokeWidth: value })}
                    >
                        <svg viewBox="0 0 24 12" className="w-5" aria-hidden>
                            <line
                                x1="2" y1="6" x2="22" y2="6"
                                stroke="currentColor"
                                strokeWidth={value}
                                strokeLinecap="round"
                            />
                        </svg>
                    </Choice>
                ))}
            </Field>

            <Field label="Style">
                {STROKE_STYLES.map(({ value, name, dash }) => (
                    <Choice
                        key={value}
                        label={name}
                        selected={state.strokeStyle === value}
                        onClick={() => setState({ strokeStyle: value })}
                    >
                        <svg viewBox="0 0 24 12" className="w-5" aria-hidden>
                            <line
                                x1="2" y1="6" x2="22" y2="6"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeDasharray={dash || undefined}
                            />
                        </svg>
                    </Choice>
                ))}
            </Field>

            <Field label="Corners">
                {EDGES.map(({ value, name }) => (
                    <Choice
                        key={value}
                        label={name}
                        selected={state.edges === value}
                        onClick={() => setState({ edges: value })}
                    >
                        <svg viewBox="0 0 24 24" className="w-5" aria-hidden>
                            <path
                                d={
                                    value === "round"
                                        ? "M6 18 V10 a4 4 0 0 1 4 -4 h8"
                                        : "M6 18 V6 h12"
                                }
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                            />
                        </svg>
                    </Choice>
                ))}
            </Field>

            <Field label="Opacity">
                {OPACITIES.map((value) => (
                    <Choice
                        key={value}
                        label={`${value}%`}
                        selected={state.opacity === value}
                        onClick={() => setState({ opacity: value })}
                    >
                        <span className="font-mono text-[10px]">{value}</span>
                    </Choice>
                ))}
            </Field>
        </section>
    );
}
