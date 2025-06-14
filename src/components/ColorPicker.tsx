
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

export const ColorPicker = ({ color, onChange, strokeWidth, onStrokeWidthChange }: ColorPickerProps) => {
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
    <div className="fixed top-4 right-2 z-40 sm:top-6 sm:right-4">
      <div className="bg-gradient-to-b from-white/95 to-white/90 dark:from-gray-800/95 dark:to-gray-800/90 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-lg shadow-black/5 dark:shadow-white/5 border border-gray-200/20 dark:border-gray-700/20 p-2 sm:p-3 flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
        
        {/* Color Section */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95",
                "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:shadow-md"
              )}
            >
              <div 
                className="w-4 h-4 sm:w-5 sm:h-5 rounded-md border-2 border-gray-300 dark:border-gray-500 transition-transform hover:scale-110" 
                style={{ backgroundColor: color }}
              />
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            align="center"
            className={cn(
              "w-44 sm:w-48 p-3",
              "bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg",
              "border-gray-200/20 dark:border-gray-700/20",
              "rounded-xl shadow-xl"
            )}
          >
            <div className="space-y-3">
              <div className="grid grid-cols-5 gap-2">
                {colors.map((c) => (
                  <button
                    key={c}
                    className={cn(
                      "w-6 h-6 sm:w-8 sm:h-8 rounded-md border-2 transition-all duration-200",
                      "hover:scale-110",
                      color === c 
                        ? "border-blue-500 dark:border-blue-400 ring-2 ring-blue-200 dark:ring-blue-800" 
                        : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
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
                  "w-full h-6 sm:h-8 rounded-md cursor-pointer",
                  "border border-gray-200 dark:border-gray-600",
                  "bg-white dark:bg-gray-700"
                )}
              />
            </div>
          </PopoverContent>
        </Popover>

        {/* Stroke Width Section */}
        <div className="flex items-center gap-1 sm:gap-2">
          <Palette className="h-4 w-4 sm:h-5 sm:w-5 text-gray-700 dark:text-gray-300" />
          <Input
            type="number"
            min={1}
            max={10}
            value={strokeWidth}
            onChange={(e) => handleStrokeWidthChange(e.target.value)}
            className={cn(
              "w-12 h-6 sm:w-16 sm:h-8 px-1 sm:px-2 text-center",
              "text-xs sm:text-sm font-medium",
              "bg-white dark:bg-gray-700",
              "border border-gray-200 dark:border-gray-600",
              "rounded-md",
              "focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            )}
          />
          <span className="text-xs text-gray-500 dark:text-gray-400">px</span>
        </div>
      </div>
    </div>
  );
};
