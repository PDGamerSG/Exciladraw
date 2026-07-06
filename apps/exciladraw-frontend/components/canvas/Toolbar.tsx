"use client";

import {
  Circle,
  Diamond,
  Minus,
  MousePointer,
  MoveRight,
  Pencil,
  Square,
} from "lucide-react";
import { Tool } from "../Canvas";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

const TOOLS: {
  tool: Tool;
  icon: React.ReactNode;
  label: string;
  shortcut: string;
}[] = [
  { tool: "select", icon: <MousePointer />, label: "Selection", shortcut: "1" },
  { tool: "rect", icon: <Square />, label: "Rectangle", shortcut: "2" },
  { tool: "diamond", icon: <Diamond />, label: "Diamond", shortcut: "3" },
  { tool: "ellipse", icon: <Circle />, label: "Ellipse", shortcut: "4" },
  { tool: "arrow", icon: <MoveRight />, label: "Arrow", shortcut: "5" },
  { tool: "line", icon: <Minus />, label: "Line", shortcut: "6" },
  { tool: "pencil", icon: <Pencil />, label: "Draw", shortcut: "7" },
];

export function Toolbar({
  selectedTool,
  setSelectedTool,
}: {
  selectedTool: Tool;
  setSelectedTool: (t: Tool) => void;
}) {
  return (
    <div className="pointer-events-auto flex items-center gap-1 rounded-lg bg-[#232329] p-1 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_2px_6px_rgba(0,0,0,0.35)]">
      {TOOLS.map(({ tool, icon, label, shortcut }) => (
        <Tooltip key={tool}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedTool(tool)}
              className={cn(
                "relative h-9 w-9 rounded-lg text-[#e3e3e8] hover:bg-[#2e2d39] hover:text-[#e3e3e8] [&_svg]:size-4",
                selectedTool === tool &&
                  "bg-[#403e6a] hover:bg-[#403e6a] text-white hover:text-white"
              )}
            >
              {icon}
              <span
                className={cn(
                  "absolute bottom-0.5 right-1 text-[9px] font-normal",
                  selectedTool === tool ? "text-white/60" : "text-[#7a7a85]"
                )}
              >
                {shortcut}
              </span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {label} — {shortcut}
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
