
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sun, Moon, Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/contexts/ThemeContext";

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  strokeWidth: number;
  onStrokeWidthChange: (width: number) => void;
}

export const ColorPicker = ({ color, onChange, strokeWidth, onStrokeWidthChange }: ColorPickerProps) => {
  const { theme, toggleTheme } = useTheme();
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
      <div className="p-4 space-y-4 w-64 bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-xl shadow-lg border border-gray-200/20 dark:border-gray-700/20">
        {/* Theme Section */}
        <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Theme</p>
            <Button
            variant="outline"
            onClick={toggleTheme}
            className="w-full justify-start gap-2 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-600"
            >
            {theme === 'light' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            <span>Switch to {theme === 'light' ? 'Dark' : 'Light'} Mode</span>
            </Button>
        </div>

        {/* Drawing Color Section */}
        <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Drawing Color</p>
            <div className="grid grid-cols-5 gap-2">
            {colors.map((c) => (
                <button
                key={c}
                className={cn(
                    "w-full aspect-square rounded-md border-2 transition-all duration-200 hover:scale-110",
                    color === c 
                    ? "border-blue-500 dark:border-blue-400 ring-2 ring-blue-300 dark:ring-blue-700" 
                    : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
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
            className="w-full h-8 rounded-md cursor-pointer border border-gray-300 dark:border-gray-600 bg-transparent"
            />
        </div>

        {/* Stroke Width Section */}
        <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Stroke Width</p>
            <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            <Input
                type="number"
                min={1}
                max={10}
                value={strokeWidth}
                onChange={(e) => handleStrokeWidthChange(e.target.value)}
                className="w-20 h-8 px-2 text-center text-sm font-medium bg-gray-50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-500 dark:text-gray-400">px</span>
            </div>
        </div>
      </div>
    </div>
  );
};
