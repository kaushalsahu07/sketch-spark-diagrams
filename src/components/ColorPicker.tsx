
import React from "react";
import { cn } from "@/lib/utils";

// This file is now just a little palette-style color grid, used in SettingsMenu
interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
}
const COLORS = [
  "#1e40af", "#dc2626", "#059669", "#d97706", "#7c3aed",
  "#be185d", "#0891b2", "#65a30d", "#000000", "#6b7280"
];

export const ColorPicker: React.FC<ColorPickerProps> = ({ color, onChange }) => (
  <div className="grid grid-cols-5 gap-2">
    {COLORS.map((c) => (
      <button
        key={c}
        className={cn(
          "w-8 h-8 rounded-md border-2 transition-all duration-200",
          color === c
            ? "border-blue-500 ring-2 ring-blue-200"
            : "border-gray-300 hover:border-gray-400"
        )}
        style={{ backgroundColor: c }}
        onClick={() => onChange(c)}
        aria-label={`Select color ${c}`}
      />
    ))}
  </div>
);
