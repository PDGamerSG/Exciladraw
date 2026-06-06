import {
  Pencil,
  Shapes,
  Users,
  Share2,
  Download,
  Lock,
  Star,
  ArrowRight,
  Zap,
} from 'lucide-react';
import Button from '@repo/ui/button';
import FeatureCard from '@repo/ui/card';
import Navbar from '@repo/ui/navbar';
import SketchCanvas from '@repo/ui/canvas';

const FEATURES = [
  {
    icon: Pencil,
    title: 'Freehand Drawing',
    description: 'Natural strokes that feel like pen on paper — fluid, expressive, and precise.',
  },
  {
    icon: Shapes,
    title: 'Smart Shapes',
    description: 'Rough rectangles and circles auto-snap into clean geometry without losing character.',
  },
  {
    icon: Users,
    title: 'Real-time Collaboration',
    description: 'Share a link and see your teammates\' cursors and edits as they happen.',
  },
  {
    icon: Share2,
    title: 'One-Click Sharing',
    description: 'Generate a public link or embed your diagram anywhere in seconds.',
  },
  {
    icon: Download,
    title: 'Export Anywhere',
    description: 'Download as PNG, SVG, or the open .sketchpad format. Your work, your files.',
  },
  {
    icon: Lock,
    title: 'End-to-End Encrypted',
    description: 'Private boards are encrypted client-side. Your ideas stay yours.',
  },
];

const STEPS = [
  {
    n: '1',
    title: 'Open a board',
    description: 'No account needed. Click "Start Drawing" and your canvas is ready immediately.',
  },
  {
    n: '2',
    title: 'Invite your team',
    description: 'Share the URL. Collaborators join instantly with live cursors and presence.',
  },
  {
    n: '3',
    title: 'Export or embed',
    description: 'Download PNG/SVG or drop an embed link into Notion, Linear, or your docs.',
  },
];

const TESTIMONIALS = [
  {
    quote: "We replaced three tools with Sketchpad. The real-time collaboration is indistinguishable from being in the same room.",
    name: 'Sarah Chen',
    role: 'Head of Design, Vercel',
    avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=64&h=64&dpr=2',
  },
  {
    quote: "Open source AND production-ready. I forked it Friday and had a custom internal deployment by Monday.",
    name: 'Marcus Reid',
    role: 'Engineering Manager, Stripe',
    avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=64&h=64&dpr=2',
  },
  {
    quote: "The infinite canvas just gets out of your way. It feels like thinking, not like using software.",
    name: 'Priya Nair',
    role: 'CTO, Luma Labs',
    avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=64&h=64&dpr=2',
  },
];

export default function Page() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navbar />

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-20 pb-24 px-6">
        <div className="absolute inset-0 grid-bg pointer-events-none" />

        <div className="relative max-w-5xl mx-auto">
          {/* GitHub pill */}
          <div className="flex justify-center mb-10 anim-fade-in">
            <a
              href="#"
              className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-1.5 text-xs font-medium text-gray-600 shadow-sm hover:shadow transition-shadow"
            >
              <Star size={12} className="text-yellow-400 fill-yellow-400" />
              2,400+ stars on GitHub
              <ArrowRight size={11} className="text-gray-400" />
            </a>
          </div>

          {/* Headline */}
          <div className="text-center max-w-3xl mx-auto mb-8">
            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-[1.1] mb-5 anim-fade-up">
              The whiteboard that
              <br />
              <span className="font-sketch" style={{ fontSize: '1.1em', color: '#111827' }}>
                thinks like you do.
              </span>
            </h1>
            <p className="text-base text-gray-500 max-w-xl mx-auto leading-relaxed anim-fade-up d-200">
              An open-source, end-to-end encrypted canvas for teams. No account, no friction — just draw.
            </p>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-2.5 justify-center mb-16 anim-fade-up d-300">
            <Button href="#" variant="primary" withArrow>
              Open the Canvas
            </Button>
          </div>

          {/* Canvas mockup */}
          <div className="anim-fade-in d-400">
            <SketchCanvas />
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────── */}
      <section id="features" className="py-20 px-6 border-t border-gray-100">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Features</p>
            <h2 className="text-2xl font-bold text-gray-900">Everything you need to think visually</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {FEATURES.map((f) => (
              <FeatureCard key={f.title} {...f} />
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-gray-50 border-y border-gray-100">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">How it works</p>
            <h2 className="text-2xl font-bold text-gray-900">Up and running in 30 seconds</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {STEPS.map(({ n, title, description }) => (
              <div key={n} className="relative">
                <span className="font-sketch text-6xl font-bold text-gray-100 absolute -top-2 -right-1 select-none leading-none">
                  {n}
                </span>
                <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-white text-xs font-bold">{n}</span>
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1.5">{title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Testimonials</p>
            <h2 className="text-2xl font-bold text-gray-900">Trusted by builders</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {TESTIMONIALS.map(({ quote, name, role, avatar }) => (
              <div key={name} className="card-hover bg-white rounded-xl p-5 border border-gray-100">
                <p className="text-sm text-gray-600 leading-relaxed mb-4">&ldquo;{quote}&rdquo;</p>
                <div className="flex items-center gap-2.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={avatar} alt={name} className="w-8 h-8 rounded-full object-cover" />
                  <div>
                    <p className="text-xs font-semibold text-gray-900">{name}</p>
                    <p className="text-xs text-gray-400">{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-gray-900">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-3">
            Start with a blank canvas.
          </h2>
          <p className="text-gray-400 text-sm mb-8">
            No download. No account. Open a board and draw right now.
          </p>
          <Button href="#" variant="outline" withArrow>
            Open the Canvas
          </Button>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gray-900 rounded flex items-center justify-center">
              <Pencil size={11} className="text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-900">Sketchpad</span>
            <span className="text-gray-300 text-sm mx-2">·</span>
            <span className="text-xs text-gray-400">Apache 2.0</span>
          </div>

          <div className="flex items-center gap-5">
            {['Privacy', 'Terms'].map((item) => (
              <a key={item} href="#" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                {item}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
