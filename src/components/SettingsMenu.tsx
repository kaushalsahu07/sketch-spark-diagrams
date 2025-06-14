
import React from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { Palette, Settings, Sun, Moon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SettingsMenuProps {
  color: string;
  onColorChange: (color: string) => void;
  strokeWidth: number;
  onStrokeWidthChange: (width: number) => void;
}

const COLORS = [
  "#1e40af", "#dc2626", "#059669", "#d97706", "#7c3aed",
  "#be185d", "#0891b2", "#65a30d", "#000000", "#6b7280"
];

export const SettingsMenu: React.FC<SettingsMenuProps> = ({
  color,
  onColorChange,
  strokeWidth,
  onStrokeWidthChange
}) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="h-10 w-10 flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-xl transition-all shadow-lg"
          aria-label="Open settings"
        >
          <Settings className="w-6 h-6" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className={cn(
          "w-80 p-5 bg-gray-800 text-gray-100 rounded-2xl shadow-2xl border-none space-y-6"
        )}
      >
        <div>
          <span className="font-semibold text-md mb-1 block">Theme</span>
          <button
            className="flex items-center gap-2 w-full px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition"
            onClick={toggleTheme}
          >
            {theme === "dark" ? (
              <>
                <Sun className="w-5 h-5" />
                Switch to Light Mode
              </>
            ) : (
              <>
                <Moon className="w-5 h-5" />
                Switch to Dark Mode
              </>
            )}
          </button>
        </div>
        <div>
          <span className="font-semibold text-md mb-1 block">Drawing Color</span>
          <div className="grid grid-cols-5 gap-2 mb-2">
            {COLORS.map((c) => (
              <button
                key={c}
                className={cn(
                  "w-8 h-8 rounded-md border-2 transition-all",
                  color === c
                    ? "border-blue-500 ring-2 ring-blue-300"
                    : "border-gray-700 hover:border-gray-500"
                )}
                style={{ backgroundColor: c }}
                onClick={() => onColorChange(c)}
                aria-label={`Select color ${c}`}
              />
            ))}
          </div>
          <input
            type="color"
            value={color}
            onChange={(e) => onColorChange(e.target.value)}
            className="w-full h-8 rounded-md border-none outline-none cursor-pointer"
            style={{ background: "transparent" }}
          />
        </div>
        <div>
          <span className="font-semibold text-md mb-1 block">Stroke Width</span>
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-gray-400" />
            <div className="relative">
              <Input
                type="number"
                min={1}
                max={10}
                value={strokeWidth}
                onChange={e => {
                  const v = parseInt(e.target.value, 10);
                  if (!isNaN(v) && v >= 1 && v <= 10) onStrokeWidthChange(v);
                }}
                className="w-20 h-8 rounded-md bg-gray-700 text-white border border-gray-600 px-2 text-center"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">px</span>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
