import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-xl border border-ink-700 bg-ink-900 px-3.5 py-2 text-base text-chalk-100",
          "transition-colors duration-200 placeholder:text-chalk-500",
          "hover:border-ink-600",
          "focus-visible:border-amber-400/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/20",
          "disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
