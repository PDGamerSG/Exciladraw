import Link from "next/link";
import { ArrowRight, Circle, Diamond, Eraser, Hand, Minus, MousePointer2, MoveRight, Pencil, Square, Type } from "lucide-react";
import { HeroSheet } from "@/components/HeroSheet";
import { Wordmark } from "@/components/Wordmark";
import { ThemeControl } from "@/components/ThemeControl";

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
const WORKFLOWS = [
    { title: "Start with the messy version.", body: "A quick sketch, a flowchart, a plan for Monday. Draw freely or open a template, then move things around until the idea makes sense." },
    { title: "Pull up a chair.", body: "Send an invite link and draw together. See each other's cursors, add a thought, and work through the same diagram in real time." },
    { title: "Take the drawing with you.", body: "Copy a few shapes into another board. Export a PNG for a message, an SVG for a document, or save the editable board for later." },
];

export default function Page() {
    return (
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <header className="flex min-h-20 items-center justify-between gap-4 border-b border-ink-700/70">
                <Wordmark />
                <nav aria-label="Main navigation" className="flex items-center gap-2 sm:gap-4">
                    <Link href="/signin" className="rounded-md px-2 py-2 text-sm text-chalk-300 hover:text-chalk-100">Sign in</Link>
                    <ThemeControl />
                </nav>
            </header>
            <main>
                <section className="pb-12 pt-14 sm:pb-16 sm:pt-20">
                    <div className="grid items-end gap-7 md:grid-cols-[1.25fr_1fr] md:gap-16">
                        <h1 className="max-w-xl font-[Georgia,serif] text-[clamp(2.75rem,6.5vw,5rem)] font-normal leading-[1.04] tracking-[-0.045em] text-chalk-100">
                            Some ideas need<br />a little room.
                        </h1>
                        <div className="max-w-md pb-1">
                            <p className="text-base leading-relaxed text-chalk-300">A shared whiteboard for the things that are easier to draw than explain. Just you, your team, and space to work it out.</p>
                            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
                                <Link href="/signup" className="inline-flex h-11 items-center gap-3 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover">
                                    Start a board <ArrowRight className="h-4 w-4" aria-hidden />
                                </Link>
                                <a href="#tools" className="py-2 text-sm text-chalk-300 underline decoration-ink-600 underline-offset-4 hover:text-chalk-100">Explore the tools</a>
                            </div>
                            <p className="mt-4 text-xs text-chalk-500">Free to use. Open source. Yours to make a mess of.</p>
                        </div>
                    </div>
                    <div className="mt-12 sm:mt-16"><HeroSheet /></div>
                </section>
                <section aria-labelledby="workflow-heading" className="grid gap-8 border-t border-ink-700/70 py-12 md:grid-cols-[1fr_1.5fr] md:gap-20 sm:py-16">
                    <div>
                        <h2 id="workflow-heading" className="max-w-xs text-2xl font-medium leading-tight tracking-tight sm:text-3xl">From &ldquo;what if&rdquo;<br />to &ldquo;that&apos;s it.&rdquo;</h2>
                        <p className="mt-4 max-w-xs text-sm leading-relaxed text-chalk-500">A few familiar tools. Plenty of ways to use them.</p>
                    </div>
                    <div className="divide-y divide-ink-700/70">
                        {WORKFLOWS.map(({ title, body }, index) => (
                            <article key={title} className="flex gap-5 py-6 first:pt-0 last:pb-0">
                                <span aria-hidden className="pt-1 font-mono text-xs text-chalk-500">0{index + 1}</span>
                                <div>
                                    <h3 className="text-base font-medium text-chalk-100">{title}</h3>
                                    <p className="mt-2 max-w-lg text-sm leading-relaxed text-chalk-300">{body}</p>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>
                <section id="tools" aria-labelledby="tools-heading" className="scroll-mt-8 border-t border-ink-700/70 py-12 sm:py-16">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                        <h2 id="tools-heading" className="text-2xl font-medium tracking-tight">Everything within reach.</h2>
                        <p className="max-w-sm text-sm leading-relaxed text-chalk-500">Pick a tool, or press its shortcut. Hold Space to pan and keep following the idea.</p>
                    </div>
                    <ul className="mt-8 grid grid-cols-2 gap-x-6 sm:grid-cols-3 lg:grid-cols-5">
                        {TOOLBOX.map(({ icon: Icon, name, key }) => (
                            <li key={name} className="flex items-center gap-3 border-b border-ink-700/70 py-4">
                                <Icon className="h-4 w-4 shrink-0 text-chalk-300" aria-hidden />
                                <span className="flex-1 text-sm text-chalk-300">{name}</span>
                                <kbd className="font-mono text-xs text-chalk-500">{key}</kbd>
                            </li>
                        ))}
                    </ul>
                </section>
                <section className="flex flex-col justify-between gap-6 border-t border-ink-700/70 py-12 sm:flex-row sm:items-center sm:py-16">
                    <div>
                        <h2 className="font-[Georgia,serif] text-3xl tracking-tight sm:text-4xl">What are you thinking about?</h2>
                        <p className="mt-3 text-sm text-chalk-500">Give it a board. See where it goes.</p>
                    </div>
                    <Link href="/signup" className="inline-flex h-11 shrink-0 items-center justify-center gap-3 self-start rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary-hover sm:self-auto">
                        Start drawing <ArrowRight className="h-4 w-4" aria-hidden />
                    </Link>
                </section>
            </main>
            <footer className="flex flex-col justify-between gap-4 border-t border-ink-700/70 py-7 text-xs text-chalk-500 sm:flex-row sm:items-center">
                <Wordmark />
                <a href="https://github.com/PDGamerSG/Exciladraw" className="rounded py-2 underline-offset-4 hover:text-chalk-100 hover:underline">Open source on GitHub</a>
            </footer>
        </div>
    );
}
