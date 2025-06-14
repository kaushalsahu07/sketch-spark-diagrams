
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
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 sm:h-10 w-8 sm:w-10 rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95",
            "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:shadow-md"
          )}
        >
          <Settings className="h-4 w-4 sm:h-5 sm:w-5 transform transition-transform duration-200 group-hover:scale-110" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        align="end"
        className={cn(
          "w-80 p-4",
          "bg-gray-800/95 dark:bg-gray-800/95 backdrop-blur-lg",
          "border-gray-700/20 dark:border-gray-700/20",
          "rounded-xl shadow-xl z-50"
        )}
      >
        <div className="space-y-6">
          {/* Theme Section */}
          <div>
            <h3 className="text-white font-medium mb-3">Theme</h3>
            <Button
              onClick={toggleTheme}
              variant="ghost"
              className={cn(
                "w-full justify-start gap-3 h-10 px-3",
                "text-gray-300 hover:bg-gray-700/50 hover:text-white",
                "rounded-lg transition-all duration-200"
              )}
            >
              {theme === 'light' ? (
                <>
                  <Sun className="h-4 w-4" />
                  <span>Switch to Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4" />
                  <span>Switch to Dark Mode</span>
                </>
              )}
            </Button>
          </div>

          {/* Drawing Color Section */}
          <div>
            <h3 className="text-white font-medium mb-3">Drawing Color</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-5 gap-2">
                {colors.map((c) => (
                  <button
                    key={c}
                    className={cn(
                      "w-12 h-12 rounded-lg border-2 transition-all duration-200",
                      "hover:scale-110",
                      color === c 
                        ? "border-blue-400 ring-2 ring-blue-400/50" 
                        : "border-gray-600 hover:border-gray-500"
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
                  "w-full h-10 rounded-lg cursor-pointer",
                  "border border-gray-600",
                  "bg-gray-700"
                )}
              />
            </div>
          </div>

          {/* Stroke Width Section */}
          <div>
            <h3 className="text-white font-medium mb-3">Stroke Width</h3>
            <div className="flex items-center gap-3">
              <Palette className="h-4 w-4 text-gray-400" />
              <Input
                type="number"
                min={1}
                max={10}
                value={strokeWidth}
                onChange={(e) => handleStrokeWidthChange(e.target.value)}
                className={cn(
                  "flex-1 h-10 px-3 text-center",
                  "text-sm font-medium text-white",
                  "bg-gray-700 border-gray-600",
                  "rounded-lg",
                  "focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                )}
              />
              <span className="text-sm text-gray-400">px</span>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
