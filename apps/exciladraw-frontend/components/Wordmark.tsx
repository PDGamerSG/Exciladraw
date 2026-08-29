import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * The mark is the smallest complete diagram anyone draws in the app: a box,
 * an arrow, a node. It is made of the tool's own primitives rather than a
 * generic pencil glyph, and is drawn at the same stroke weight the board uses.
 */
export function Mark({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 28 28"
            fill="none"
            aria-hidden
            className={cn("h-7 w-7", className)}
        >
            <rect
                x="2.5" y="7.5" width="10" height="9" rx="1.5"
                stroke="currentColor" strokeWidth="1.75"
            />
            <path
                d="M13.5 12h6.5"
                stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"
            />
            <path
                d="M18 9.6 20.5 12 18 14.4"
                stroke="currentColor" strokeWidth="1.75"
                strokeLinecap="round" strokeLinejoin="round"
            />
            <circle
                cx="22.5" cy="19.5" r="4"
                stroke="currentColor" strokeWidth="1.75"
            />
        </svg>
    );
}

export function Wordmark({
    href = "/",
    className,
}: {
    href?: string | null;
    className?: string;
}) {
    const content = (
        <>
            <Mark className="h-6 w-6 text-amber-400" />
            <span className="font-display text-[15px] font-semibold tracking-tight text-chalk-100">
                Exciladraw
            </span>
        </>
    );

    if (!href) {
        return <span className={cn("flex items-center gap-2.5", className)}>{content}</span>;
    }

    return (
        <Link
            href={href}
            className={cn(
                "flex items-center gap-2.5 rounded-lg transition-opacity hover:opacity-80",
                className
            )}
        >
            {content}
        </Link>
    );
}
