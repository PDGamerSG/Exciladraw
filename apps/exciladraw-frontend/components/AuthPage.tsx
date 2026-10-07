"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { api, errorMessage, setToken } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeControl } from "@/components/ThemeControl";
import { Wordmark } from "@/components/Wordmark";
import { AuthSketchbook } from "@/components/AuthSketchbook";

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
        <main className="relative isolate flex min-h-svh flex-col bg-ink-950">
            <div aria-hidden className="grid-paper pointer-events-none absolute inset-0 opacity-70" />
            <header className="relative z-10 mx-auto flex w-full max-w-[1600px] items-center justify-between px-5 py-5 sm:px-9 lg:px-14 lg:py-7">
                <Link href="/" className="inline-flex min-h-10 items-center gap-2 rounded px-2 text-sm text-chalk-300 transition-colors hover:bg-ink-800">
                    <ArrowLeft className="h-4 w-4" aria-hidden /> Back to home
                </Link>
                <ThemeControl />
            </header>

            <div className="relative z-10 mx-auto grid w-full max-w-[1600px] flex-1 gap-8 px-5 pb-10 pt-5 sm:px-9 lg:grid-cols-[1fr_440px] lg:items-center lg:gap-16 lg:px-14 lg:pb-16 lg:pt-7 xl:grid-cols-[1fr_460px]">
                <section aria-label="A shared drawing space" className="min-w-0 py-1 text-chalk-100 lg:py-8">
                    <p className="max-w-xl text-[clamp(2.1rem,4.6vw,4.5rem)] font-semibold leading-[1.05] tracking-[-0.045em]">
                        Every idea starts<br />with <span className="text-amber-400">a sketch.</span>
                    </p>
                    <p className="mt-5 max-w-sm text-sm leading-relaxed text-chalk-300 sm:text-base">A few shapes. A connecting line. That moment when everyone sees what you mean.</p>
                    <div className="mt-8 hidden sm:block"><AuthSketchbook /></div>
                </section>
                <div className="auth-form relative mx-auto w-full max-w-[460px] rounded-xl border border-ink-700 px-6 py-8 sm:px-9 sm:py-10">
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
                            className="mt-1 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition-colors duration-200 hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
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
            <footer className="relative z-10 px-7 pb-5 text-xs text-chalk-500 sm:px-11 lg:px-16">
                Draw freely. Figure it out together.
            </footer>
        </main>
    );
}
