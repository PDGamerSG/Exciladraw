import type { ShapeStyle } from "./types";

export type BoardTheme = "light" | "dark";

export const BOARD_PALETTES = {
    light: { background: "#faf9f6", grid: "rgba(45,42,36,0.055)", majorGrid: "rgba(45,42,36,0.1)", accent: "#97612b" },
    dark: { background: "#121212", grid: "rgba(255,255,255,0.04)", majorGrid: "rgba(255,255,255,0.075)", accent: "#ffb35c" },
} as const;

// Stored inks stay stable across collaborators and file round-trips. Only the
// built-in palette adapts; custom imported colours retain their exact values.
const LIGHT_INKS: Record<string, string> = {
    "#e3e3e8": "#303431", "#e3e7f0": "#303431",
    "#ff6b6b": "#b13d42", "#4ade80": "#28704b", "#60a5fa": "#326baf",
    "#fbbf24": "#956514", "#a78bfa": "#7654aa", "#ff8fb1": "#aa456b",
    "#4a2632": "#f6dfe0", "#1f3a2c": "#deeddf", "#1e3252": "#dce8f5",
    "#453113": "#f4e8c9", "#332a52": "#e9e1f4",
};

export function displayColor(color: string, theme: BoardTheme) {
    return theme === "light" ? LIGHT_INKS[color.toLowerCase()] ?? color : color;
}

export function displayStyle(style: ShapeStyle, theme: BoardTheme): ShapeStyle {
    return { ...style, strokeColor: displayColor(style.strokeColor, theme), fillColor: displayColor(style.fillColor, theme) };
}
