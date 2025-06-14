
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Settings, Sun, Moon, Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/contexts/ThemeContext";

interface SettingsMenuProps {
  color: string;
  onChange: (color: string) => void;
  strokeWidth: number;
  onStrokeWidthChange: (width: number) => void;
}

export const SettingsMenu = ({ color, onChange, strokeWidth, onStrokeWidthChange }: SettingsMenuProps) => {
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
    <div className="fixed top-4 right-4 z-40">
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-9 w-9 rounded-lg transition-all duration-200",
                "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              )}
            >
              <Settings className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            align="end"
            className={cn(
              "w-64 p-4",
              "bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg",
              "border-gray-200/50 dark:border-gray-700/50",
              "rounded-lg shadow-xl"
            )}
          >
            <div className="space-y-4">
              {/* Theme Section */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Theme
                </h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleTheme}
                  className={cn(
                    "w-full justify-start gap-2",
                    "bg-white dark:bg-gray-700",
                    "border-gray-200 dark:border-gray-600",
                    "hover:bg-gray-50 dark:hover:bg-gray-600"
                  )}
                >
                  {theme === 'light' ? (
                    <>
                      <Moon className="h-4 w-4" />
                      Switch to Dark Mode
                    </>
                  ) : (
                    <>
                      <Sun className="h-4 w-4" />
                      Switch to Light Mode
                    </>
                  )}
                </Button>
              </div>

              {/* Color Picker Section */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Drawing Color
                </h4>
                <div className="grid grid-cols-5 gap-2">
                  {colors.map((c) => (
                    <button
                      key={c}
                      className={cn(
                        "w-8 h-8 rounded-md border-2 transition-all duration-200",
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

              {/* Stroke Width Section */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Stroke Width
                </h4>
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={strokeWidth}
                    onChange={(e) => handleStrokeWidthChange(e.target.value)}
                    className={cn(
                      "flex-1 h-8 text-center",
                      "text-sm font-medium",
                      "bg-white dark:bg-gray-700",
                      "border border-gray-200 dark:border-gray-600",
                      "rounded-md",
                      "focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400"
                    )}
                  />
                  <span className="text-sm text-gray-500 dark:text-gray-400">px</span>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};
