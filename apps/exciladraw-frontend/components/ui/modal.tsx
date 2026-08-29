"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A small focus-trapping dialog. Radix' dialog would be a heavier dependency
 * than two modals justify, but the accessibility contract is the same one:
 * escape closes, focus is trapped while open and restored on close.
 */
export function Modal({
    open,
    onClose,
    title,
    description,
    children,
    className,
}: {
    open: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    children: React.ReactNode;
    className?: string;
}) {
    const panelRef = useRef<HTMLDivElement>(null);
    const restoreTo = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (!open) return;
        restoreTo.current = document.activeElement as HTMLElement | null;

        const focusables = () =>
            panelRef.current?.querySelectorAll<HTMLElement>(
                'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
            ) ?? ([] as unknown as NodeListOf<HTMLElement>);

        focusables()[0]?.focus();

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                e.stopPropagation();
                onClose();
                return;
            }
            if (e.key !== "Tab") return;
            const items = focusables();
            if (!items.length) return;
            const first = items[0]!;
            const last = items[items.length - 1]!;
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        };

        document.addEventListener("keydown", onKeyDown, true);
        return () => {
            document.removeEventListener("keydown", onKeyDown, true);
            restoreTo.current?.focus?.();
        };
    }, [open, onClose]);

    if (!open || typeof document === "undefined") return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <button
                type="button"
                aria-label="Close"
                tabIndex={-1}
                onClick={onClose}
                className="absolute inset-0 cursor-default bg-ink-950/70 backdrop-blur-[2px] ink-in"
            />
            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-label={title}
                className={cn(
                    "panel rise relative w-full max-w-md rounded-2xl p-5",
                    className
                )}
            >
                <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                        <h2 className="font-display text-base font-semibold tracking-tight text-chalk-100">
                            {title}
                        </h2>
                        {description && (
                            <p className="mt-1 text-[13px] leading-relaxed text-chalk-500">
                                {description}
                            </p>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="-mr-1 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-chalk-500 transition-colors hover:bg-ink-750 hover:text-chalk-100"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
                {children}
            </div>
        </div>,
        document.body
    );
}
