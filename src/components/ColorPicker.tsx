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
    <div className="">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-10 w-10 rounded-xl bg-[#23272f] text-white border-none hover:bg-[#363d47]"
            )}
          >
            <div 
              className="w-6 h-6 rounded-md border-2 border-[#4a5361]"
              style={{ backgroundColor: color }}
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          align="center"
          className="w-64 p-4 bg-[#23272f] border-none rounded-xl shadow-xl"
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
                      : "border-[#4a5361] hover:border-blue-400"
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
              className="w-full h-8 rounded-md cursor-pointer border-none bg-[#363d47]"
            />
            <div className="flex flex-row items-center gap-2 mt-2">
              <span className="text-white text-xs">Stroke Width</span>
              <Input
                type="number"
                min={1}
                max={10}
                value={strokeWidth}
                onChange={(e) => handleStrokeWidthChange(e.target.value)}
                className="w-16 h-8 px-2 text-center text-sm font-medium bg-[#23272f] text-white border border-[#4a5361] rounded-md focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-xs text-gray-400">px</span>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
