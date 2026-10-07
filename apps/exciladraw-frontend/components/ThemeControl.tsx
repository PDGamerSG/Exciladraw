"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme, type ThemePreference } from "@/lib/theme";
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function ThemeControl() {
    const { preference, setPreference } = useTheme();
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button type="button" aria-label="Appearance" title="Appearance"
                    className="pointer-events-auto inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-ink-700 bg-ink-850 text-chalk-300 transition-colors hover:bg-ink-800 hover:text-chalk-100">
                    <Sun className="h-4 w-4 dark:hidden" aria-hidden />
                    <Moon className="hidden h-4 w-4 dark:block" aria-hidden />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuLabel className="text-xs text-chalk-500">Appearance</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={preference} onValueChange={(value) => setPreference(value as ThemePreference)}>
                    <DropdownMenuRadioItem value="light"><Sun className="mr-2 h-4 w-4" />Light</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="dark"><Moon className="mr-2 h-4 w-4" />Dark</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="system"><Monitor className="mr-2 h-4 w-4" />System</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
