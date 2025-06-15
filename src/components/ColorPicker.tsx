
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  strokeWidth: number;
  onStrokeWidthChange: (width: number) => void;
}

export const ColorPicker = ({
  color,
  onChange,
  strokeWidth,
  onStrokeWidthChange,
}: ColorPickerProps) => {
  const colors = [
    "#1e40af", "#dc2626", "#059669", "#d97706", "#7c3aed", 
    "#be185d", "#0891b2", "#65a30d", "#000000", "#6b7280"
  ];

  const handleStrokeWidthChange = (value: string) => {
    const width = parseInt(value, 10);
    if (!isNaN(width) && width >= 1 && width <= 10) {
      onStrokeWidthChange(width);
    }
  };

  return (
    <div>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              // Adjust the background for light/dark
              "h-10 w-10 rounded-xl border-none",
              "bg-white text-gray-800 hover:bg-gray-100 dark:bg-[#23272f] dark:text-white hover:dark:bg-[#363d47]"
            )}
          >
            <div
              className="w-6 h-6 rounded-md border-2 border-[#e5e7eb] dark:border-[#4a5361]"
              style={{ backgroundColor: color }}
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="center"
          className={cn(
            "w-64 p-4 rounded-xl shadow-xl border-none",
            "bg-white text-gray-900 dark:bg-[#23272f] dark:text-white"
          )}
        >
          <div className="flex flex-col gap-4">
            <div className="flex flex-row gap-2 justify-between">
              {colors.map((c) => (
                <button
                  key={c}
                  className={cn(
                    "w-8 h-8 rounded-md border-2 transition-all duration-200",
                    color === c
                      ? "border-blue-500 ring-2 ring-blue-400"
                      : "border-[#cbd5e1] hover:border-blue-400 dark:border-[#4a5361]"
                  )}
                  style={{ backgroundColor: c }}
                  onClick={() => onChange(c)}
                />
              ))}
            </div>
            <input
              type="color"
              value={color}
              onChange={(e) => onChange(e.target.value)}
              className={cn(
                "w-full h-8 rounded-md cursor-pointer border-none",
                "bg-[#f3f4f6] dark:bg-[#363d47]"
              )}
            />
            <div className="flex flex-row items-center gap-2 mt-2">
              <span className="text-gray-800 dark:text-white text-xs">
                Stroke Width
              </span>
              <Input
                type="number"
                min={1}
                max={10}
                value={strokeWidth}
                onChange={(e) => handleStrokeWidthChange(e.target.value)}
                className={cn(
                  "w-16 h-8 px-2 text-center text-sm font-medium rounded-md",
                  "bg-white text-gray-800 border border-[#cbd5e1] focus:ring-2 focus:ring-blue-500",
                  "dark:bg-[#23272f] dark:text-white dark:border-[#4a5361]"
                )}
              />
              <span className="text-xs text-gray-400">px</span>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
