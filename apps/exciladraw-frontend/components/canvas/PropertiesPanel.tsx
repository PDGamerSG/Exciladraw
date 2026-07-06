"use client";

import { cn } from "@/lib/utils";
import { ShapeStyle } from "@/draw/Game";

export type PanelState = ShapeStyle;

const STROKE_COLORS = ["#d3d3d3", "#e03131", "#2f9e44", "#1971c2", "#f08c00"];
const BG_COLORS = ["transparent", "#ffc9c9", "#b2f2bb", "#a5d8ff", "#ffec99"];

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 text-[11px] text-[#b4b4bb]">{label}</div>
      <div className="flex items-center gap-1.5">{children}</div>
    </div>
  );
}

function ColorSwatch({
  color,
  selected,
  onClick,
}: {
  color: string;
  selected: boolean;
  onClick: () => void;
}) {
  const isTransparent = color === "transparent";
  return (
    <button
      onClick={onClick}
      aria-label={color}
      className={cn(
        "h-[22px] w-[22px] rounded",
        isTransparent &&
          "bg-[linear-gradient(45deg,#3a3a42_25%,transparent_25%,transparent_75%,#3a3a42_75%),linear-gradient(45deg,#3a3a42_25%,#2b2b31_25%,#2b2b31_75%,#3a3a42_75%)] bg-[length:8px_8px] bg-[position:0_0,4px_4px]",
        selected && "ring-1 ring-[#a8a5ff] ring-offset-1 ring-offset-[#232329]"
      )}
      style={isTransparent ? undefined : { backgroundColor: color }}
    />
  );
}

export function PropertiesPanel({
  state,
  setState,
}: {
  state: PanelState;
  setState: (s: Partial<PanelState>) => void;
}) {
  return (
    <div className="flex w-[202px] flex-col gap-3 p-3">
      <Section label="Stroke">
        {STROKE_COLORS.map((c) => (
          <ColorSwatch
            key={c}
            color={c}
            selected={state.strokeColor === c}
            onClick={() => setState({ strokeColor: c })}
          />
        ))}
      </Section>

      <Section label="Background">
        {BG_COLORS.map((c) => (
          <ColorSwatch
            key={c}
            color={c}
            selected={state.fillColor === c}
            onClick={() => setState({ fillColor: c })}
          />
        ))}
      </Section>
    </div>
  );
}
