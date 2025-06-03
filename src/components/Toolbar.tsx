
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  MousePointer, 
  Pencil, 
  Square, 
  Circle, 
  Minus, 
  Type,
  Trash2,
  Undo,
  ZoomIn,
  ZoomOut,
  Sparkles,
  Download
} from "lucide-react";
import { Tool } from "./Canvas";

interface ToolbarProps {
  activeTool: Tool;
  onToolClick: (tool: Tool) => void;
  onClear: () => void;
  onUndo: () => void;
  onZoom: (direction: 'in' | 'out') => void;
  onShowAI: () => void;
  onShowExport: () => void;
}

export const Toolbar = ({ 
  activeTool, 
  onToolClick, 
  onClear, 
  onUndo, 
  onZoom,
  onShowAI,
  onShowExport
}: ToolbarProps) => {
  const tools = [
    { id: "select" as Tool, icon: MousePointer, label: "Select" },
    { id: "draw" as Tool, icon: Pencil, label: "Draw" },
    { id: "rectangle" as Tool, icon: Square, label: "Rectangle" },
    { id: "circle" as Tool, icon: Circle, label: "Circle" },
    { id: "line" as Tool, icon: Minus, label: "Line" },
    { id: "text" as Tool, icon: Type, label: "Text" },
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-2 flex items-center gap-1">
      {/* Main Tools */}
      {tools.map((tool) => (
        <Button
          key={tool.id}
          variant={activeTool === tool.id ? "default" : "ghost"}
          size="sm"
          onClick={() => onToolClick(tool.id)}
          className="h-9 w-9 p-0"
          title={tool.label}
        >
          <tool.icon className="h-4 w-4" />
        </Button>
      ))}

      <Separator orientation="vertical" className="h-6" />

      {/* Action Tools */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onUndo}
        className="h-9 w-9 p-0"
        title="Undo"
      >
        <Undo className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={onClear}
        className="h-9 w-9 p-0 text-red-600 hover:text-red-700"
        title="Clear Canvas"
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="h-6" />

      {/* Zoom Controls */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onZoom('in')}
        className="h-9 w-9 p-0"
        title="Zoom In"
      >
        <ZoomIn className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => onZoom('out')}
        className="h-9 w-9 p-0"
        title="Zoom Out"
      >
        <ZoomOut className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="h-6" />

      {/* AI Assistant */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onShowAI}
        className="h-9 w-9 p-0 text-purple-600 hover:text-purple-700"
        title="AI Assistant"
      >
        <Sparkles className="h-4 w-4" />
      </Button>

      {/* Export */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onShowExport}
        className="h-9 w-9 p-0 text-green-600 hover:text-green-700"
        title="Export"
      >
        <Download className="h-4 w-4" />
      </Button>
    </div>
  );
};
