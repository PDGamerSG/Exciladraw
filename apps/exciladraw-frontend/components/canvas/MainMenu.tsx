"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { PanelState, PropertiesPanel } from "./PropertiesPanel";

export function MainMenu({
  panelState,
  setPanelState,
}: {
  panelState: PanelState;
  setPanelState: (s: Partial<PanelState>) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="pointer-events-auto h-9 w-9 rounded-lg bg-[#232329] text-[#e3e3e8] shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_2px_6px_rgba(0,0,0,0.35)] hover:bg-[#2e2d39] hover:text-[#e3e3e8]"
        >
          <Menu />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        sideOffset={6}
        className="border-[#38373f] bg-[#232329] p-0 text-[#e3e3e8] shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_2px_6px_rgba(0,0,0,0.35)]"
      >
        <PropertiesPanel state={panelState} setState={setPanelState} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
