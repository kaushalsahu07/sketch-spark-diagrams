
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Palette } from "lucide-react";

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  strokeWidth: number;
  onStrokeWidthChange: (width: number) => void;
}

export const ColorPicker = ({ color, onChange }: ColorPickerProps) => {
  const colors = [
    "#1e40af", "#dc2626", "#059669", "#d97706", "#7c3aed", 
    "#be185d", "#0891b2", "#65a30d", "#000000", "#6b7280"
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
            <div className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded border-2 border-gray-300" 
                style={{ backgroundColor: color }}
              />
              <Palette className="h-4 w-4" />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-3">
          <div className="space-y-3">
            <div className="grid grid-cols-5 gap-2">
              {colors.map((c) => (
                <button
                  key={c}
                  className={`w-8 h-8 rounded border-2 ${
                    color === c ? 'border-gray-400' : 'border-gray-200'
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
                className="w-full h-8 rounded border border-gray-200"
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
