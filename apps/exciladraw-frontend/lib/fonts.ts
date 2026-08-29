import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";

/** Body and UI text. */
export const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
    display: "swap"
});

/**
 * Display face. Space Grotesk's slightly mechanical letterforms belong to the
 * same world as the drafting instruments the interface is modelled on.
 */
export const spaceGrotesk = Space_Grotesk({
    subsets: ["latin"],
    weight: ["500", "600", "700"],
    variable: "--font-space-grotesk",
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

export const fontVariables = `${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`;
