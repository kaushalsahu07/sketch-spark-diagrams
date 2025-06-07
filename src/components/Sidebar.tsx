
import React from 'react';
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sun, Moon, Palette, Minus } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface SidebarProps {
  color: string;
  onColorChange: (color: string) => void;
  strokeWidth: number;
  onStrokeWidthChange: (width: number) => void;
}

export const Sidebar = ({ color, onColorChange, strokeWidth, onStrokeWidthChange }: SidebarProps) => {
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
    <div className="fixed left-4 top-1/2 -translate-y-1/2 z-40">
      <div className="bg-gradient-to-b from-white/95 to-white/90 dark:from-gray-800/95 dark:to-gray-800/90 backdrop-blur-xl rounded-2xl shadow-lg shadow-black/5 dark:shadow-white/5 border border-gray-200/20 dark:border-gray-700/20 p-4 flex flex-col gap-4 w-64">
        
        {/* Theme Toggle Section */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Theme</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className={cn(
              "w-full justify-start gap-2 h-10 rounded-xl transition-all duration-300",
              "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50"
            )}
          >
            {theme === 'light' ? (
              <>
                <Moon className="h-4 w-4" />
                <span>Dark Mode</span>
              </>
            ) : (
              <>
                <Sun className="h-4 w-4" />
                <span>Light Mode</span>
              </>
            )}
          </Button>
        </div>

        <Separator className="bg-gray-200/50 dark:bg-gray-600/50" />

        {/* Color Picker Section */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Color</h3>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "w-full justify-start gap-2 h-10 rounded-xl transition-all duration-300",
                  "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                )}
              >
                <div 
                  className="w-4 h-4 rounded-md border-2 border-gray-300 dark:border-gray-500" 
                  style={{ backgroundColor: color }}
                />
                <span>Change Color</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              side="right"
              align="start"
              className={cn(
                "w-48 p-3",
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
                        "w-7 h-7 rounded-md border-2 transition-all duration-200",
                        "hover:scale-110",
                        color === c 
                          ? "border-blue-500 dark:border-blue-400 ring-2 ring-blue-200 dark:ring-blue-800" 
                          : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                      )}
                      style={{ backgroundColor: c }}
                      onClick={() => onColorChange(c)}
                    />
                  ))}
                </div>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => onColorChange(e.target.value)}
                  className={cn(
                    "w-full h-8 rounded-md cursor-pointer",
                    "border border-gray-200 dark:border-gray-600",
                    "bg-white dark:bg-gray-700"
                  )}
                />
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <Separator className="bg-gray-200/50 dark:bg-gray-600/50" />

        {/* Stroke Width Section */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Stroke Width</h3>
          <div className="flex items-center gap-2">
            <Minus className="h-4 w-4 text-gray-700 dark:text-gray-300" />
            <Input
              type="number"
              min={1}
              max={10}
              value={strokeWidth}
              onChange={(e) => handleStrokeWidthChange(e.target.value)}
              className={cn(
                "flex-1 h-8 px-2 text-center",
                "text-sm font-medium",
                "bg-white dark:bg-gray-700",
                "border border-gray-200 dark:border-gray-600",
                "rounded-md",
                "focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              )}
            />
            <span className="text-xs text-gray-500 dark:text-gray-400">px</span>
          </div>
          
          {/* Visual stroke width preview */}
          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">Preview:</span>
            <div className="flex items-center justify-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md">
              <div 
                className="w-16 h-1 rounded-full"
                style={{ 
                  backgroundColor: color,
                  height: `${strokeWidth}px`
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
