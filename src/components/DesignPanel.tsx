
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Canvas as FabricCanvas } from "fabric";

interface DesignPanelProps {
  canvas: FabricCanvas | null;
  activeColor: string;
  onColorChange: (color: string) => void;
}

export const DesignPanel = ({ canvas, activeColor, onColorChange }: DesignPanelProps) => {
  const strokeColors = [
    "#e5e7eb", "#ef4444", "#22c55e", "#3b82f6", "#f97316", "#ffffff"
  ];

  const backgroundColors = [
    "#000000", "#7f1d1d", "#166534", "#1e3a8a", "#9a3412"
  ];

  const fillPatterns = [
    { type: "diagonal", label: "Diagonal lines" },
    { type: "dots", label: "Dots" },
    { type: "solid", label: "Solid" }
  ];

  const strokeWidths = [
    { size: "thin", value: 1 },
    { size: "medium", value: 3 },
    { size: "thick", value: 6 }
  ];

  const strokeStyles = [
    { type: "solid", label: "Solid line" },
    { type: "dashed", label: "Dashed line" },
    { type: "dotted", label: "Dotted line" }
  ];

  const sloppiness = [
    { level: "precise", label: "Precise" },
    { level: "sketchy", label: "Sketchy" },
    { level: "very-sketchy", label: "Very sketchy" }
  ];

  const edges = [
    { type: "sharp", label: "Sharp edges" },
    { type: "round", label: "Round edges" }
  ];

  const fontFamilies = [
    { name: "Handwritten", value: "Comic Sans MS" },
    { name: "Normal", value: "Arial" },
    { name: "Code", value: "Courier New" },
    { name: "Serif", value: "Times New Roman" }
  ];

  const fontSizes = [
    { size: "S", value: 12 },
    { size: "M", value: 16 },
    { size: "L", value: 20 },
    { size: "XL", value: 24 }
  ];

  const textAlignments = [
    { type: "left", label: "Left align" },
    { type: "center", label: "Center align" },
    { type: "right", label: "Right align" }
  ];

  const handleColorClick = (color: string) => {
    onColorChange(color);
    
    if (canvas) {
      const activeObject = canvas.getActiveObject();
      if (activeObject) {
        if (activeObject.type === 'path') {
          activeObject.set({ stroke: color });
        } else {
          activeObject.set({ 
            fill: color,
            stroke: color 
          });
        }
        canvas.renderAll();
      }
    }
  };

  return (
    <div className="fixed left-4 top-20 w-64 bg-gray-800 text-white rounded-lg shadow-xl p-4 max-h-[calc(100vh-6rem)] overflow-y-auto z-20">
      {/* Stroke Colors */}
      <div className="mb-6">
        <h3 className="text-sm font-medium mb-3">Stroke</h3>
        <div className="grid grid-cols-6 gap-2">
          {strokeColors.map((color) => (
            <button
              key={color}
              className={`w-8 h-8 rounded border-2 ${
                activeColor === color ? 'border-blue-400' : 'border-gray-600'
              }`}
              style={{ backgroundColor: color }}
              onClick={() => handleColorClick(color)}
            />
          ))}
        </div>
      </div>

      <Separator className="bg-gray-600 mb-6" />

      {/* Background Colors */}
      <div className="mb-6">
        <h3 className="text-sm font-medium mb-3">Background</h3>
        <div className="grid grid-cols-5 gap-2">
          {backgroundColors.map((color) => (
            <button
              key={color}
              className="w-8 h-8 rounded border-2 border-gray-600"
              style={{ backgroundColor: color }}
              onClick={() => {
                if (canvas) {
                  canvas.backgroundColor = color;
                  canvas.renderAll();
                }
              }}
            />
          ))}
        </div>
      </div>

      <Separator className="bg-gray-600 mb-6" />

      {/* Fill Patterns */}
      <div className="mb-6">
        <h3 className="text-sm font-medium mb-3">Fill</h3>
        <div className="grid grid-cols-3 gap-2">
          {fillPatterns.map((pattern) => (
            <Button
              key={pattern.type}
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 bg-gray-700 border-gray-600 hover:bg-gray-600"
            >
              <div className="w-4 h-4 bg-white rounded"></div>
            </Button>
          ))}
        </div>
      </div>

      <Separator className="bg-gray-600 mb-6" />

      {/* Stroke Style */}
      <div className="mb-6">
        <h3 className="text-sm font-medium mb-3">Stroke style</h3>
        <div className="grid grid-cols-3 gap-2">
          {strokeStyles.map((style) => (
            <Button
              key={style.type}
              variant="outline"
              size="sm"
              className="h-8 p-2 bg-gray-700 border-gray-600 hover:bg-gray-600 text-xs"
            >
              —
            </Button>
          ))}
        </div>
      </div>

      <Separator className="bg-gray-600 mb-6" />

      {/* Sloppiness */}
      <div className="mb-6">
        <h3 className="text-sm font-medium mb-3">Sloppiness</h3>
        <div className="grid grid-cols-3 gap-2">
          {sloppiness.map((level) => (
            <Button
              key={level.level}
              variant="outline"
              size="sm"
              className="h-8 p-2 bg-gray-700 border-gray-600 hover:bg-gray-600 text-xs"
            >
              ~
            </Button>
          ))}
        </div>
      </div>

      <Separator className="bg-gray-600 mb-6" />

      {/* Edges */}
      <div className="mb-6">
        <h3 className="text-sm font-medium mb-3">Edges</h3>
        <div className="grid grid-cols-2 gap-2">
          {edges.map((edge) => (
            <Button
              key={edge.type}
              variant="outline"
              size="sm"
              className="h-8 p-2 bg-gray-700 border-gray-600 hover:bg-gray-600 text-xs"
            >
              ⌐
            </Button>
          ))}
        </div>
      </div>

      <Separator className="bg-gray-600 mb-6" />

      {/* Font Family */}
      <div className="mb-6">
        <h3 className="text-sm font-medium mb-3">Font family</h3>
        <div className="grid grid-cols-4 gap-2">
          {fontFamilies.map((font) => (
            <Button
              key={font.name}
              variant="outline"
              size="sm"
              className="h-8 p-1 bg-gray-700 border-gray-600 hover:bg-gray-600 text-xs"
            >
              {font.name === "Handwritten" ? "✎" : 
               font.name === "Normal" ? "A" :
               font.name === "Code" ? "</>" : "A"}
            </Button>
          ))}
        </div>
      </div>

      <Separator className="bg-gray-600 mb-6" />

      {/* Font Size */}
      <div className="mb-6">
        <h3 className="text-sm font-medium mb-3">Font size</h3>
        <div className="grid grid-cols-4 gap-2">
          {fontSizes.map((size) => (
            <Button
              key={size.size}
              variant="outline"
              size="sm"
              className="h-8 p-2 bg-gray-700 border-gray-600 hover:bg-gray-600 text-xs"
            >
              {size.size}
            </Button>
          ))}
        </div>
      </div>

      <Separator className="bg-gray-600 mb-6" />

      {/* Text Align */}
      <div className="mb-4">
        <h3 className="text-sm font-medium mb-3">Text align</h3>
        <div className="grid grid-cols-3 gap-2">
          {textAlignments.map((align) => (
            <Button
              key={align.type}
              variant="outline"
              size="sm"
              className="h-8 p-2 bg-gray-700 border-gray-600 hover:bg-gray-600 text-xs"
            >
              {align.type === "left" ? "≡" : align.type === "center" ? "≣" : "≡"}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};
