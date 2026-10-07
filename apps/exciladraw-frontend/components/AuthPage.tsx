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
        <main className="relative flex min-h-screen w-full items-center justify-center px-5 pb-10 pt-20 sm:px-8 lg:py-24">

            <div className="absolute right-5 top-5"><ThemeControl /></div>
            <Link
                href="/"
                className="absolute left-4 top-4 inline-flex h-9 items-center gap-2 rounded-lg px-3 text-[13px] text-chalk-500 transition-colors duration-200 hover:bg-ink-850 hover:text-chalk-100 sm:left-6 sm:top-6"
            >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to home
            </Link>

            <div className="grid w-full max-w-[1180px] gap-9 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-16">
                <AuthLandscape />
                <div className="relative mx-auto w-full max-w-[380px] py-2 lg:py-10">
                    <div className="mb-8 flex flex-col items-start gap-8">
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
                            className="mt-1 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-colors duration-200 hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
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
        </main>
    );
}
