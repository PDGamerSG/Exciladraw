import { Inter, JetBrains_Mono } from "next/font/google";

/** Body and UI text. */
export const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
    display: "swap"
});

/**
 * The utility face. Anything that is really a reading off the instrument —
 * a zoom level, a shortcut key, a room number — is set in mono.
 */
export const jetbrainsMono = JetBrains_Mono({
    subsets: ["latin"],
    weight: ["400", "500"],
    variable: "--font-jetbrains-mono",
    display: "swap"
});

export const fontVariables = `${inter.variable} ${jetbrainsMono.variable}`;
