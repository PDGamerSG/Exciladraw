import Link from "next/link";
import {
    ArrowRight,
    Circle,
    Diamond,
    Eraser,
    Hand,
    Minus,
    MousePointer2,
    MoveRight,
    Pencil,
    Scan,
    Share2,
    Shield,
    Signature,
    Square,
    Type,
    Undo2,
    Users,
} from "lucide-react";
import { HeroSheet } from "@/components/HeroSheet";
import { Wordmark } from "@/components/Wordmark";

const FEATURES = [
    {
        icon: Signature,
        title: "Freehand that stays smooth",
        body: "Strokes are curved through their own sample points as you draw, then thinned before they're saved. A fast scribble still looks like one.",
    },
    {
        icon: Square,
        title: "Shapes that square off",
        body: "Rectangles, diamonds, ellipses, arrows and lines. Hold Shift to keep a box square or lock an arrow to 15° steps.",
    },
    {
        icon: Users,
        title: "Everyone's cursor, live",
        body: "See where your teammates are pointing and what they're drawing, the moment they draw it.",
    },
    {
        icon: Scan,
        title: "A canvas that doesn't end",
        body: "Pan with space, zoom with Ctrl-scroll, and press Shift 1 to bring the whole drawing back on screen.",
    },
    {
        icon: Undo2,
        title: "Undo the whole room sees",
        body: "Ctrl Z takes a stroke back for everyone on the board, not just on your screen. So does moving, restyling and erasing.",
    },
    {
        icon: Shield,
        title: "Boards stay private",
        body: "A board opens only for the people you send the invite link to. Guessing a board number gets you nowhere.",
    },
];

const TOOLBOX = [
    { icon: MousePointer2, name: "Select", key: "V" },
    { icon: Hand, name: "Pan", key: "H" },
    { icon: Square, name: "Rectangle", key: "R" },
    { icon: Diamond, name: "Diamond", key: "D" },
    { icon: Circle, name: "Ellipse", key: "O" },
    { icon: MoveRight, name: "Arrow", key: "A" },
    { icon: Minus, name: "Line", key: "L" },
    { icon: Pencil, name: "Draw", key: "P" },
    { icon: Type, name: "Text", key: "T" },
    { icon: Eraser, name: "Eraser", key: "E" },
];

function SectionLabel({ children }: { children: string }) {
    return (
        <div className="mb-4 flex items-center gap-3">
            <span className="h-px w-8 bg-ink-600" aria-hidden />
            <span className="eyebrow">{children}</span>
        </div>
    );
}

export default function Page() {
    return (
        <div className="relative min-h-screen overflow-x-hidden">
            <div className="lamp pointer-events-none absolute -top-56 left-1/2 h-[620px] w-[1000px] -translate-x-1/2" />
            <div className="grid-paper pointer-events-none absolute inset-x-0 top-0 h-[900px] [mask-image:linear-gradient(to_bottom,black,transparent)]" />

            <div className="relative mx-auto w-full max-w-6xl px-5 sm:px-8">
                <header className="flex h-20 items-center justify-between">
                    <Wordmark />
                    <nav className="flex items-center gap-1.5">
                        <Link
                            href="/signin"
                            className="inline-flex h-9 items-center rounded-xl px-3.5 text-[13px] text-chalk-300 transition-colors duration-200 hover:bg-ink-800 hover:text-chalk-100"
                        >
                            Sign in
                        </Link>
                        <Link
                            href="/signup"
                            className="inline-flex h-9 items-center rounded-xl bg-amber-400 px-3.5 text-[13px] font-medium text-ink-950 transition-colors duration-200 hover:bg-amber-300"
                        >
                            Start a board
                        </Link>
                    </nav>
                </header>

                <main>
                    <section className="pb-12 pt-10 sm:pb-16 sm:pt-16">
                        <div className="rise mx-auto max-w-2xl text-center">
                            <p className="eyebrow">Open source · Real-time</p>
                            <h1 className="mt-5 font-display text-[2.75rem] font-semibold leading-[1.05] tracking-[-0.02em] text-chalk-100 sm:text-6xl">
                                Draw it out.
                                <br />
                                <span className="text-amber-400">Together, live.</span>
                            </h1>
                            <p className="mx-auto mt-6 max-w-lg text-[15px] leading-relaxed text-chalk-300">
                                Shapes, arrows and freehand strokes on an infinite canvas. Send one
                                link and your whole team is sketching on the same board, every
                                stroke arriving as it&apos;s drawn.
                            </p>
                            <div className="mt-9 flex flex-col items-center justify-center gap-2.5 sm:flex-row">
                                <Link
                                    href="/signup"
                                    className="group inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-6 text-sm font-medium text-ink-950 shadow-[0_2px_24px_-6px_var(--amber-400)] transition-colors duration-200 hover:bg-amber-300 sm:w-auto"
                                >
                                    Start a board
                                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                                </Link>
                                <Link
                                    href="/signin"
                                    className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-ink-700 px-6 text-sm text-chalk-300 transition-colors duration-200 hover:border-ink-600 hover:bg-ink-850 hover:text-chalk-100 sm:w-auto"
                                >
                                    Open your boards
                                </Link>
                            </div>
                        </div>

                        <div
                            className="rise mt-12 sm:mt-16"
                            style={{ animationDelay: "0.15s" }}
                        >
                            <HeroSheet />
                        </div>
                    </section>

                    <section className="border-t border-ink-800 py-14 sm:py-20">
                        <SectionLabel>What you get</SectionLabel>
                        <h2 className="max-w-xl font-display text-2xl font-semibold tracking-tight text-chalk-100 sm:text-3xl">
                            Built to keep up with a room full of people thinking out loud.
                        </h2>

                        <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-ink-800 bg-ink-800 sm:grid-cols-2 lg:grid-cols-3">
                            {FEATURES.map(({ icon: Icon, title, body }) => (
                                <article
                                    key={title}
                                    className="group bg-ink-950 p-6 transition-colors duration-300 hover:bg-ink-900"
                                >
                                    <Icon
                                        className="h-[18px] w-[18px] text-amber-400 transition-transform duration-300 group-hover:-translate-y-0.5"
                                        aria-hidden
                                    />
                                    <h3 className="mb-2 mt-5 font-display text-[15px] font-semibold tracking-tight text-chalk-100">
                                        {title}
                                    </h3>
                                    <p className="text-[13px] leading-relaxed text-chalk-500">
                                        {body}
                                    </p>
                                </article>
                            ))}
                        </div>
                    </section>

                    {/* The toolbox is the product, so the page shows it rather than
                        narrating a three-step signup flow. */}
                    <section className="border-t border-ink-800 py-14 sm:py-20">
                        <SectionLabel>The toolbox</SectionLabel>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                            <h2 className="max-w-md font-display text-2xl font-semibold tracking-tight text-chalk-100 sm:text-3xl">
                                Ten tools, each one keystroke away.
                            </h2>
                            <p className="max-w-xs text-[13px] leading-relaxed text-chalk-500">
                                Every tool answers to a letter and a number, so your hand never has
                                to leave the board to find it.
                            </p>
                        </div>

                        <ul className="mt-10 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
                            {TOOLBOX.map(({ icon: Icon, name, key }) => (
                                <li
                                    key={name}
                                    className="flex items-center gap-3 rounded-xl border border-ink-800 bg-ink-900 px-3.5 py-3 transition-colors duration-200 hover:border-ink-700"
                                >
                                    <Icon className="h-4 w-4 shrink-0 text-chalk-300" aria-hidden />
                                    <span className="flex-1 truncate text-[13px] text-chalk-300">
                                        {name}
                                    </span>
                                    <kbd className="rounded-md border border-ink-700 bg-ink-850 px-1.5 py-0.5 font-mono text-[10px] text-chalk-500">
                                        {key}
                                    </kbd>
                                </li>
                            ))}
                        </ul>
                    </section>

                    <section className="border-t border-ink-800 py-14 sm:py-20">
                        <div className="sheet relative overflow-hidden rounded-2xl border border-ink-700 bg-ink-900 px-6 py-16 text-center sm:py-20">
                            <div className="lamp pointer-events-none absolute -top-24 left-1/2 h-[320px] w-[560px] -translate-x-1/2" />
                            <div className="grid-paper pointer-events-none absolute inset-0" />
                            <div className="relative">
                                <h2 className="font-display text-2xl font-semibold tracking-tight text-chalk-100 sm:text-3xl">
                                    Open a blank board.
                                </h2>
                                <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-chalk-300">
                                    Make an account, name a board, send the link. That&apos;s the whole
                                    setup.
                                </p>
                                <Link
                                    href="/signup"
                                    className="group mt-8 inline-flex h-11 items-center gap-2 rounded-xl bg-amber-400 px-6 text-sm font-medium text-ink-950 shadow-[0_2px_24px_-6px_var(--amber-400)] transition-colors duration-200 hover:bg-amber-300"
                                >
                                    Start drawing — it&apos;s free
                                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                                </Link>
                            </div>
                        </div>
                    </section>
                </main>

                <footer className="flex flex-col items-center justify-between gap-4 border-t border-ink-800 py-9 sm:flex-row">
                    <Wordmark />
                    <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-500">
                        <Share2 className="h-3 w-3" aria-hidden />
                        Open source · Built for teams
                    </p>
                </footer>
            </div>
        </div>
    );
}
