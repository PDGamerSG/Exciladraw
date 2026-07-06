"use client";

import { HTTP_BACKEND } from "@/config";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Loader2, Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { onest } from "@/lib/fonts";
import { cn } from "@/lib/utils";

export function AuthPage({ isSignin }: { isSignin: boolean }) {
    const router = useRouter();
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
            if (isSignin) {
                const res = await axios.post(`${HTTP_BACKEND}/signin`, {
                    username,
                    password
                });
                localStorage.setItem("token", res.data.token);
                router.push("/room");
            } else {
                await axios.post(`${HTTP_BACKEND}/signup`, {
                    username,
                    password,
                    name
                });
                router.push("/signin");
            }
        } catch (err: any) {
            setError(
                err?.response?.data?.message ??
                    (isSignin ? "could not sign you in. check your details." : "could not create your account. try again.")
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <div
            className={cn(
                onest.className,
                "dark relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-background px-4 text-foreground"
            )}
        >
            {/* ambient glow */}
            <div className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[720px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(168,165,255,0.14),transparent_65%)]" />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:44px_44px]" />

            <div className="relative w-full max-w-sm">
                {/* brand */}
                <div className="mb-8 flex flex-col items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-primary/10 bg-foreground/5 backdrop-blur-md">
                        <Pencil className="h-5 w-5 text-[#a8a5ff]" />
                    </div>
                    <div className="text-center">
                        <h1 className="text-2xl font-semibold tracking-tight">
                            {isSignin ? "welcome back" : "create your account"}
                        </h1>
                        <p className="mt-1.5 text-sm text-muted-foreground">
                            {isSignin
                                ? "sign in to keep sketching with your team"
                                : "start sketching with your team in seconds"}
                        </p>
                    </div>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="flex flex-col gap-4 rounded-2xl border border-primary/10 bg-foreground/5 p-6 backdrop-blur-md"
                >
                    {!isSignin && (
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="name">name</Label>
                            <Input
                                id="name"
                                type="text"
                                placeholder="your name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                    )}
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="email">email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="you@example.com"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="password">password</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {error && (
                        <p className="rounded-xl border border-destructive/20 bg-destructive/10 px-3.5 py-2.5 text-sm text-red-400">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="mt-1 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-foreground text-sm font-medium text-background transition-all duration-300 ease-[cubic-bezier(0.45,0.05,0.55,0.95)] hover:bg-foreground/85 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                        {isSignin ? "sign in" : "sign up"}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-muted-foreground">
                    {isSignin ? "don't have an account? " : "already have an account? "}
                    <Link
                        href={isSignin ? "/signup" : "/signin"}
                        className="text-foreground underline-offset-4 transition-colors hover:underline"
                    >
                        {isSignin ? "sign up" : "sign in"}
                    </Link>
                </p>
            </div>
        </div>
    );
}
