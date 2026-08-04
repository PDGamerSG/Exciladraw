"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function BackButton() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          asChild
          variant="ghost"
          size="icon"
          className="pointer-events-auto h-9 w-9 rounded-lg bg-[#232329] text-[#e3e3e8] shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_2px_6px_rgba(0,0,0,0.35)] hover:bg-[#2e2d39] hover:text-[#e3e3e8]"
        >
          <Link href="/room" aria-label="Back to your rooms">
            <ArrowLeft />
          </Link>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">Back to your rooms</TooltipContent>
    </Tooltip>
  );
}
