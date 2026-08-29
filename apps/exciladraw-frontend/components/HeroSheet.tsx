const INK = {
    graphite: "var(--pen-graphite)",
    blue: "var(--pen-blue)",
    amber: "var(--pen-amber)",
    green: "var(--pen-green)",
    red: "var(--pen-red)",
};

/** A stroke that plots itself on, in the order a person would draw it. */
function Stroke({
    d,
    length,
    delay,
    color,
    width = 2,
}: {
    d: string;
    length: number;
    delay: number;
    color: string;
    width?: number;
}) {
    return (
        <path
            d={d}
            fill="none"
            stroke={color}
            strokeWidth={width}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="plot"
            style={{ "--len": length, animationDelay: `${delay}s` } as React.CSSProperties}
        />
    );
}

function Label({
    x,
    y,
    delay,
    children,
}: {
    x: number;
    y: number;
    delay: number;
    children: string;
}) {
    return (
        <text
            x={x}
            y={y}
            textAnchor="middle"
            fill={INK.graphite}
            fontSize="15"
            className="ink-in font-sans"
            style={{ animationDelay: `${delay}s` }}
        >
            {children}
        </text>
    );
}

/** Another person's pointer, drawn the way the board draws it. */
function Cursor({
    x,
    y,
    name,
    color,
    delay,
}: {
    x: number;
    y: number;
    name: string;
    color: string;
    delay: number;
}) {
    return (
        <g
            className="ink-in"
            style={{ animationDelay: `${delay}s` }}
            transform={`translate(${x} ${y})`}
        >
            <path
                d="M0 0 L0 17 L4.4 12.8 L10.5 12.2 Z"
                fill={color}
                stroke="var(--board)"
                strokeWidth="1.5"
            />
            <rect x="11" y="15" width={name.length * 6.6 + 12} height="19" rx="6" fill={color} />
            <text x="17" y="28" fontSize="11" fill="var(--board)" className="font-sans">
                {name}
            </text>
        </g>
    );
}

/**
 * The hero. Rather than describing what the product makes, the page draws it:
 * the smallest real diagram anyone sketches in a meeting, plotted stroke by
 * stroke, with two other people's cursors already on the board. It finishes
 * the way these things always finish — somebody circles the answer.
 */
export function HeroSheet() {
    return (
        <figure className="sheet relative rounded-2xl border border-ink-700 bg-ink-900 p-2 shadow-[0_40px_80px_-32px_rgb(0_0_0_/_0.85)]">
            <div className="relative overflow-hidden rounded-xl bg-board">
                <div className="grid-paper pointer-events-none absolute inset-0" />

                <svg
                    viewBox="0 0 800 240"
                    className="relative block w-full"
                    role="img"
                    aria-label="A diagram being drawn: a box labelled Idea, an arrow to a diamond labelled Ship it, an arrow to an ellipse labelled Ship, with the answer circled by hand. Two collaborators' cursors are on the board."
                >
                    <Stroke d="M56 58 h180 v100 h-180 Z" length={560} delay={0.3} color={INK.blue} />
                    <Label x={146} y={114} delay={0.95}>Idea</Label>

                    <Stroke d="M244 108 H304" length={60} delay={0.95} color={INK.graphite} />
                    <Stroke d="M292 99 L308 108 L292 117" length={40} delay={1.15} color={INK.graphite} />

                    <Stroke
                        d="M400 52 L492 108 L400 164 L308 108 Z"
                        length={440}
                        delay={1.25}
                        color={INK.amber}
                    />
                    <Label x={400} y={114} delay={1.85}>Ship it?</Label>

                    <Stroke d="M500 108 H560" length={60} delay={1.8} color={INK.graphite} />
                    <Stroke d="M548 99 L564 108 L548 117" length={40} delay={2.0} color={INK.graphite} />

                    <Stroke
                        d="M640 66 a62 42 0 1 0 0.1 0"
                        length={330}
                        delay={2.1}
                        color={INK.green}
                    />
                    <Label x={640} y={114} delay={2.6}>Ship</Label>

                    {/* the circle somebody always draws around the answer */}
                    <Stroke
                        d="M642 38 C 718 40, 740 82, 734 118 C 728 156, 684 182, 636 178 C 582 174, 552 144, 556 106 C 560 68, 596 40, 650 38 C 682 37, 706 48, 720 62"
                        length={620}
                        delay={2.8}
                        color={INK.red}
                        width={2.5}
                    />

                    <Cursor x={264} y={178} name="Ada" color="var(--pen-violet)" delay={1.55} />
                    <Cursor x={516} y={28} name="Ren" color="var(--pen-green)" delay={2.35} />
                </svg>
            </div>

            {/* the instrument's own status line */}
            <figcaption className="flex items-center justify-between gap-3 px-2.5 pb-0.5 pt-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-500">
                <span>Grid 20 · Zoom 100%</span>
                <span className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-pen-green" aria-hidden />
                    3 drawing
                </span>
            </figcaption>
        </figure>
    );
}
