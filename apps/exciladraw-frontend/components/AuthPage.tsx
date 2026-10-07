"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Loader2 } from "lucide-react";
import { api, errorMessage, setToken } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeControl } from "@/components/ThemeControl";
import { Wordmark } from "@/components/Wordmark";
import { AuthLandscape } from "@/components/AuthLandscape";

/** Only same-origin paths are followed, so ?next= cannot bounce you offsite. */
function safeNext(next: string | null) {
    if (!next || !next.startsWith("/") || next.startsWith("//")) return "/room";
    return next;
}

export function AuthPage({ isSignin }: { isSignin: boolean }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const next = safeNext(searchParams.get("next"));

    const [name, setName] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const res = await api.post<{ token: string }>(
                isSignin ? "/signin" : "/signup",
                isSignin ? { username, password } : { username, password, name }
            );
            // signing up returns a token too, so a new account lands on their
            // boards instead of being bounced back to the sign in form
            setToken(res.data.token);
            router.push(next);
        } catch (err) {
            setError(
                errorMessage(
                    err,
                    isSignin
                        ? "Couldn't sign you in. Check your email and password."
                        : "Couldn't create your account. Try again."
                )
            );
            setLoading(false);
        }
    }

    const passwordHint = isSignin ? undefined : "At least 6 characters.";

    return (
        <main className="relative isolate flex min-h-svh flex-col bg-[#24382b]">
            <AuthLandscape />
            <header className="relative z-10 mx-auto flex w-full max-w-[1600px] items-center justify-between px-5 py-5 sm:px-9 lg:px-14 lg:py-7">
                <Link href="/" className="inline-flex min-h-10 items-center gap-2 rounded px-2 text-sm text-[#f7f7ec] transition-colors hover:bg-black/20">
                    <ArrowLeft className="h-4 w-4" aria-hidden /> Back to home
                </Link>
                <ThemeControl />
            </header>

            <div className="relative z-10 mx-auto grid w-full max-w-[1600px] flex-1 gap-8 px-5 pb-10 pt-5 sm:px-9 lg:grid-cols-[1fr_440px] lg:items-center lg:gap-16 lg:px-14 lg:pb-16 lg:pt-7 xl:grid-cols-[1fr_460px]">
                <section aria-label="Space for your ideas" className="py-1 text-[#f7f7ec] lg:py-14">
                    <p className="mb-5 font-mono text-[11px] tracking-[0.08em] sm:text-xs">A SHARED CANVAS. AN OPEN MIND.</p>
                    <p className="max-w-[760px] text-[clamp(3.2rem,7.6vw,8rem)] font-semibold leading-[0.96] tracking-[-0.065em]">
                        Room to<br className="hidden lg:block" /> think <span className="relative inline-block text-[#d8ed89]">out loud.
                            <svg viewBox="0 0 500 28" preserveAspectRatio="none" className="absolute -bottom-3 left-0 h-5 w-full sm:-bottom-5 sm:h-7" aria-hidden="true">
                                <path d="M5 17Q202-2 489 9M42 25Q253 12 455 19" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                            </svg>
                        </span>
                    </p>
                    <p className="mt-8 max-w-[350px] text-sm leading-relaxed text-[#f7f7ec] sm:mt-10 sm:text-base">Big plans. Rough sketches. Happy accidents.<br />Give your next idea somewhere to go.</p>
                    <div className="mt-10 hidden items-center gap-3 lg:flex">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#f7f7ec]/60"><ArrowUpRight className="h-4 w-4" aria-hidden /></span>
                        <span className="text-xs text-[#f7f7ec]">Draw freely. Figure it out together.</span>
                    </div>
                </section>
                <div className="auth-form relative mx-auto w-full max-w-[460px] rounded-lg border border-white/15 px-6 py-8 sm:px-9 sm:py-10">
                    <div className="mb-7 flex flex-col items-start gap-7">
                        <Wordmark />
                        <div>
                            <h1 className="font-display text-[1.75rem] font-semibold tracking-tight text-chalk-100">
                                {isSignin ? "Welcome back" : "Create your account"}
                            </h1>
                            <p className="mt-2 text-sm text-chalk-500">
                                {isSignin
                                    ? "Sign in to pick up where your team left off."
                                    : "A place to draw, think, and work together."}
                            </p>
                        </div>
                    </div>

                    <form
                        onSubmit={handleSubmit}
                        className="flex flex-col gap-5"
                        noValidate
                    >
                        {!isSignin && (
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="name" className="eyebrow">Name</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    type="text"
                                    autoComplete="name"
                                    placeholder="Ada Lovelace"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                        )}

                        <div className="flex flex-col gap-2">
                            <Label htmlFor="email" className="eyebrow">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                placeholder="you@example.com"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label htmlFor="password" className="eyebrow">Password</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete={isSignin ? "current-password" : "new-password"}
                                placeholder="••••••••"
                                minLength={isSignin ? undefined : 6}
                                aria-describedby={passwordHint ? "password-hint" : undefined}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            {passwordHint && (
                                <p id="password-hint" className="text-xs text-chalk-500">
                                    {passwordHint}
                                </p>
                            )}
                        </div>

                        {error && (
                            <p
                                role="alert"
                                className="rounded-lg border border-destructive/25 bg-destructive/10 px-3.5 py-2.5 text-[13px] leading-relaxed text-destructive"
                            >
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="auth-submit mt-1 inline-flex h-12 w-full items-center justify-center gap-2 rounded text-sm font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                            {loading
                                ? isSignin ? "Signing in…" : "Creating your account…"
                                : isSignin ? "Sign in" : "Create account"}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-[13px] text-chalk-500">
                        {isSignin ? "No account yet? " : "Already have an account? "}
                        <Link
                            href={isSignin ? "/signup" : "/signin"}
                            className="text-chalk-100 underline decoration-ink-600 underline-offset-4 transition-colors hover:decoration-amber-400"
                        >
                            {isSignin ? "Create one" : "Sign in"}
                        </Link>
                    </p>
                </div>
            </div>
            <footer className="relative z-10 flex flex-wrap items-center justify-between gap-3 px-7 pb-5 text-[11px] text-[#f7f7ec] sm:px-11 lg:px-16">
                <span>Exciladraw · A little room for your next big idea.</span>
                <a href="https://unsplash.com/photos/78A265wPiO4" target="_blank" rel="noreferrer" className="underline decoration-white/50 underline-offset-4 hover:decoration-white">Photo: David Marcu / Unsplash</a>
            </footer>
        </main>
    );
}
