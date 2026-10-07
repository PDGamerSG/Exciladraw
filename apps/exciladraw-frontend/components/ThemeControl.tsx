"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme";

export function ThemeControl() {
    const { theme, setPreference } = useTheme();
    const dark = theme === "dark";
    return (
        <button type="button" role="switch" aria-label="Dark mode" aria-checked={dark}
            title={dark ? "Switch to light mode" : "Switch to dark mode"}
            onClick={() => setPreference(dark ? "light" : "dark")}
            className="pointer-events-auto inline-flex h-9 w-16 shrink-0 items-center justify-center rounded-full border border-ink-700 bg-ink-850 text-chalk-300 transition-colors hover:border-amber-400">
            <span className="relative h-6 w-12 rounded-full bg-ink-700 dark:bg-amber-400">
                <Sun className="absolute left-1.5 top-1.5 h-3 w-3 text-chalk-100 dark:text-ink-950" aria-hidden />
                <Moon className="absolute right-1.5 top-1.5 h-3 w-3 text-chalk-100 dark:text-ink-950" aria-hidden />
                <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-ink-850 transition-transform dark:translate-x-6 dark:bg-ink-950" />
            </span>
        </button>
    );
}
