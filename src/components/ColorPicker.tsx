
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
    <div className="fixed top-16 right-2 z-40 sm:top-4 sm:right-4">
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-lg sm:rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-1.5 sm:p-2">
        
        {/* Mobile: Stack vertically, Desktop: Horizontal layout */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          
          {/* Color Section */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 w-8 sm:h-9 sm:w-9 rounded-md sm:rounded-lg transition-all duration-200",
                  "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                )}
              >
                <div 
                  className="w-4 h-4 sm:w-5 sm:h-5 rounded-sm border-2 border-gray-300 dark:border-gray-500" 
                  style={{ backgroundColor: color }}
                />
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              align="end"
              className={cn(
                "w-40 sm:w-44 p-3",
                "bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg",
                "border-gray-200/50 dark:border-gray-700/50",
                "rounded-lg shadow-xl"
              )}
            >
              <div className="space-y-3">
                <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                  {colors.map((c) => (
                    <button
                      key={c}
                      className={cn(
                        "w-6 h-6 sm:w-7 sm:h-7 rounded-md border-2 transition-all duration-200",
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
                    "w-full h-8 rounded-md cursor-pointer",
                    "border border-gray-200 dark:border-gray-600",
                    "bg-white dark:bg-gray-700"
                  )}
                />
              </div>
            </PopoverContent>
          </Popover>

          {/* Stroke Width Section - Compact for mobile */}
          <div className="flex items-center justify-center gap-1 sm:gap-2">
            <Palette className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 dark:text-gray-400" />
            <Input
              type="number"
              min={1}
              max={10}
              value={strokeWidth}
              onChange={(e) => handleStrokeWidthChange(e.target.value)}
              className={cn(
                "w-10 h-6 sm:w-12 sm:h-7 px-1 text-center",
                "text-xs font-medium",
                "bg-white dark:bg-gray-700",
                "border border-gray-200 dark:border-gray-600",
                "rounded-md",
                "focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400"
              )}
            />
            <span className="text-xs text-gray-500 dark:text-gray-400">px</span>
          </div>
        </div>
      </div>
    </div>
  );
};
