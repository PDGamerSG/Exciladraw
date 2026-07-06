import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-xl border border-primary/10 bg-foreground/5 px-3.5 py-2 text-base text-foreground backdrop-blur-md transition-all duration-300 ease-[cubic-bezier(0.45,0.05,0.55,0.95)] placeholder:text-muted-foreground hover:border-primary/20 focus-visible:border-primary/30 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
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
