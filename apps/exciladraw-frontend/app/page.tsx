import Link from "next/link";
import {
  ArrowRight,
  Download,
  Lock,
  Pencil,
  Shapes,
  Share2,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { onest } from "@/lib/fonts";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    icon: Pencil,
    title: "freehand drawing",
    description: "natural strokes that feel like pen on paper — fluid, expressive, precise.",
  },
  {
    icon: Shapes,
    title: "shapes & arrows",
    description: "rectangles, diamonds, ellipses, arrows and lines. everything you need to diagram.",
  },
  {
    icon: Users,
    title: "real-time collaboration",
    description: "share a room and sketch together. every stroke syncs live over websockets.",
  },
  {
    icon: Share2,
    title: "room based sharing",
    description: "create a room, send the link, and your team is on the same canvas in seconds.",
  },
  {
    icon: Zap,
    title: "fast by default",
    description: "a lightweight canvas renderer keeps drawing smooth even on busy boards.",
  },
  {
    icon: Lock,
    title: "your boards, protected",
    description: "rooms live behind your account. only people you invite can join in.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "create your account",
    description: "sign up in seconds — just a name, email and password.",
  },
  {
    n: "02",
    title: "open a room",
    description: "name a room and your infinite canvas is ready immediately.",
  },
  {
    n: "03",
    title: "sketch together",
    description: "invite teammates to the room and watch ideas take shape live.",
  },
];

export default function Page() {
  return (
    <div
      className={cn(
        onest.className,
        "dark relative min-h-screen w-full overflow-hidden bg-background text-foreground"
      )}
    >
      {/* ambient glow + grid */}
      <div className="pointer-events-none absolute -top-48 left-1/2 h-[560px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(168,165,255,0.14),transparent_65%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:44px_44px]" />

      <div className="relative mx-auto w-full max-w-5xl px-4">
        {/* nav */}
        <header className="flex items-center justify-between py-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/10 bg-foreground/5 backdrop-blur-md">
              <Pencil className="h-4 w-4 text-[#a8a5ff]" />
            </div>
            <span className="text-sm font-medium">exciladraw</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Link
              href="/signin"
              className="inline-flex h-9 items-center rounded-xl border border-primary/10 bg-foreground/5 px-4 text-sm text-muted-foreground backdrop-blur-md transition-all duration-300 ease-[cubic-bezier(0.45,0.05,0.55,0.95)] hover:border-primary/20 hover:bg-primary/10 hover:text-foreground"
            >
              sign in
            </Link>
            <Link
              href="/signup"
              className="inline-flex h-9 items-center rounded-xl bg-foreground px-4 text-sm font-medium text-background transition-all duration-300 ease-[cubic-bezier(0.45,0.05,0.55,0.95)] hover:bg-foreground/85"
            >
              sign up
            </Link>
          </div>
        </header>

        {/* hero */}
        <section className="flex flex-col items-center pb-20 pt-16 text-center sm:pt-24">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/10 bg-foreground/5 px-4 py-1.5 text-xs text-muted-foreground backdrop-blur-md">
            <Sparkles className="h-3 w-3 text-[#a8a5ff]" />
            open-source collaborative whiteboard
          </div>

          <h1 className="max-w-2xl text-4xl font-semibold leading-[1.1] tracking-tight sm:text-6xl">
            think out loud,
            <br />
            <span className="text-[#a8a5ff]">sketch it together.</span>
          </h1>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
            a clean, fast whiteboard for teams. draw shapes, arrows and freehand
            strokes on an infinite canvas — synced live with everyone in the room.
          </p>

          <div className="mt-8 flex flex-col gap-2.5 sm:flex-row">
            <Link
              href="/signup"
              className="group inline-flex h-11 items-center gap-2 rounded-xl bg-foreground px-5 text-sm font-medium text-background transition-all duration-300 ease-[cubic-bezier(0.45,0.05,0.55,0.95)] hover:bg-foreground/85"
            >
              start sketching
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/signin"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-primary/10 bg-foreground/5 px-5 text-sm text-muted-foreground backdrop-blur-md transition-all duration-300 ease-[cubic-bezier(0.45,0.05,0.55,0.95)] hover:border-primary/20 hover:bg-primary/10 hover:text-foreground"
            >
              open your rooms
            </Link>
          </div>

          {/* canvas preview */}
          <div className="mt-16 w-full rounded-2xl border border-primary/10 bg-foreground/5 p-2 backdrop-blur-md">
            <div className="relative overflow-hidden rounded-xl bg-[#121212]">
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px]" />
              <svg viewBox="0 0 800 380" className="relative w-full">
                <rect x="90" y="90" width="180" height="110" rx="2" fill="none" stroke="#1971c2" strokeWidth="2" />
                <text x="180" y="150" textAnchor="middle" fill="#d3d3d3" fontSize="15" fontFamily="inherit">idea</text>
                <path d="M275 145 C 330 145, 350 145, 400 145" fill="none" stroke="#d3d3d3" strokeWidth="2" />
                <path d="M388 137 L 402 145 L 388 153" fill="none" stroke="#d3d3d3" strokeWidth="2" />
                <path d="M485 90 L 570 145 L 485 200 L 400 145 Z" fill="none" stroke="#f08c00" strokeWidth="2" />
                <text x="485" y="150" textAnchor="middle" fill="#d3d3d3" fontSize="15" fontFamily="inherit">ship it?</text>
                <path d="M570 145 C 620 145, 640 145, 680 145" fill="none" stroke="#d3d3d3" strokeWidth="2" />
                <path d="M668 137 L 682 145 L 668 153" fill="none" stroke="#d3d3d3" strokeWidth="2" />
                <ellipse cx="700" cy="260" rx="70" ry="45" fill="none" stroke="#2f9e44" strokeWidth="2" />
                <text x="700" y="265" textAnchor="middle" fill="#d3d3d3" fontSize="15" fontFamily="inherit">yes</text>
                <path d="M120 280 C 180 240, 260 320, 330 270 S 430 250, 470 290" fill="none" stroke="#e03131" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </section>

        {/* features */}
        <section className="pb-20">
          <p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">features</p>
          <h2 className="mb-8 text-2xl font-semibold tracking-tight">
            everything you need to think visually
          </h2>
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="rounded-2xl border border-primary/10 bg-foreground/5 p-5 backdrop-blur-md transition-all duration-300 ease-[cubic-bezier(0.45,0.05,0.55,0.95)] hover:border-primary/20 hover:bg-primary/10"
              >
                <div className="mb-3.5 flex h-9 w-9 items-center justify-center rounded-xl border border-primary/10 bg-foreground/5">
                  <Icon className="h-4 w-4 text-[#a8a5ff]" />
                </div>
                <h3 className="mb-1.5 text-sm font-medium">{title}</h3>
                <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* how it works */}
        <section className="pb-20">
          <p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">how it works</p>
          <h2 className="mb-8 text-2xl font-semibold tracking-tight">up and running in seconds</h2>
          <div className="grid gap-2.5 md:grid-cols-3">
            {STEPS.map(({ n, title, description }) => (
              <div
                key={n}
                className="rounded-2xl border border-primary/10 bg-foreground/5 p-5 backdrop-blur-md"
              >
                <span className="text-xs font-medium text-[#a8a5ff]">{n}</span>
                <h3 className="mb-1.5 mt-3 text-sm font-medium">{title}</h3>
                <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* cta */}
        <section className="pb-20">
          <div className="flex flex-col items-center gap-5 rounded-2xl border border-primary/10 bg-foreground/5 px-6 py-14 text-center backdrop-blur-md">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              start with a blank canvas.
            </h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              create an account, open a room, and draw with your team right now.
            </p>
            <Link
              href="/signup"
              className="group inline-flex h-11 items-center gap-2 rounded-xl bg-foreground px-5 text-sm font-medium text-background transition-all duration-300 ease-[cubic-bezier(0.45,0.05,0.55,0.95)] hover:bg-foreground/85"
            >
              get started — it&apos;s free
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </section>

        {/* footer */}
        <footer className="flex flex-col items-center justify-between gap-4 border-t border-primary/10 py-8 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-primary/10 bg-foreground/5">
              <Pencil className="h-3.5 w-3.5 text-[#a8a5ff]" />
            </div>
            <span className="text-sm font-medium">exciladraw</span>
          </div>
          <div className="flex items-center gap-5 text-xs text-muted-foreground">
            <Download className="hidden h-3.5 w-3.5 sm:block" />
            <span>open source · built for teams</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
