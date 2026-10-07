"use client";

import { useSyncExternalStore } from "react";
import type { BoardTheme } from "@/draw/theme";

export type ThemePreference = BoardTheme | "system";
const KEY = "exciladraw-theme";
const EVENT = "exciladraw-theme-change";
let memoryPreference: ThemePreference | undefined;

function preference(): ThemePreference {
    if (memoryPreference) return memoryPreference;
    try {
        const saved = localStorage.getItem(KEY);
        if (saved === "light" || saved === "dark" || saved === "system") return saved;
    } catch { /* Storage can be blocked; appearance still works for this visit. */ }
    return "dark";
}

function snapshot() {
    const choice = preference();
    const theme = choice === "system" ? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : choice;
    return `${choice}:${theme}`;
}

function apply() {
    const theme = snapshot().split(":")[1]!;
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "dark" ? "#0b0d12" : "#f6f5f1");
}

function subscribe(onChange: () => void) {
    const media = matchMedia("(prefers-color-scheme: dark)");
    const update = () => { apply(); onChange(); };
    const onStorage = (event: StorageEvent) => {
        if (event.key === KEY || event.key === null) { memoryPreference = undefined; update(); }
    };
    apply();
    media.addEventListener("change", update);
    window.addEventListener("storage", onStorage);
    window.addEventListener(EVENT, update);
    return () => {
        media.removeEventListener("change", update);
        window.removeEventListener("storage", onStorage);
        window.removeEventListener(EVENT, update);
    };
}

export function setThemePreference(value: ThemePreference) {
    memoryPreference = value;
    try { localStorage.setItem(KEY, value); } catch { /* Use memory when storage is unavailable. */ }
    apply();
    window.dispatchEvent(new Event(EVENT));
}

export function useTheme() {
    const value = useSyncExternalStore(subscribe, snapshot, () => "dark:dark");
    const [preference, theme] = value.split(":") as [ThemePreference, BoardTheme];
    return { preference, theme, setPreference: setThemePreference };
}
