
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Palette } from "lucide-react";

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

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3 space-y-3">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0 hover:bg-gray-100 dark:hover:bg-gray-700">
            <div className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded border-2 border-gray-300 dark:border-gray-500" 
                style={{ backgroundColor: color }}
              />
              <Palette className="h-4 w-4 text-gray-700 dark:text-gray-300" />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-3 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-xl">
          <div className="space-y-3">
            <div className="grid grid-cols-5 gap-2">
              {colors.map((c) => (
                <button
                  key={c}
                  className={`w-8 h-8 rounded border-2 transition-all hover:scale-110 ${
                    color === c 
                      ? 'border-blue-500 dark:border-blue-400 ring-2 ring-blue-200 dark:ring-blue-800' 
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                  style={{ backgroundColor: c }}
                  onClick={() => onChange(c)}
                />
              ))}
            </div>
            <div>
              <input
                type="color"
                value={color}
                onChange={(e) => onChange(e.target.value)}
                className="w-full h-8 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 cursor-pointer"
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Stroke Width</label>
        <Slider
          value={[strokeWidth]}
          onValueChange={(value) => onStrokeWidthChange(value[0])}
          max={10}
          min={1}
          step={1}
          className="w-32"
        />
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">{strokeWidth}px</div>
      </div>
    </div>
  );
};
