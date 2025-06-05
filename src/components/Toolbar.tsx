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
  Download,
  Eraser,
  Triangle,
  Star,
  Diamond,
  Pentagon,
  Hexagon,
  Shapes,
  ChevronDown
} from "lucide-react";
import { Tool } from "./Canvas";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const basicTools = [
    { id: "select" as Tool, icon: MousePointer, label: "Select" },
    { id: "draw" as Tool, icon: Pencil, label: "Draw" },
    { id: "text" as Tool, icon: Type, label: "Text" },
    { id: "eraser" as Tool, icon: Eraser, label: "Reality Eraser" },
  ];

  const shapes = [
    { id: "rectangle" as Tool, icon: Square, label: "Rectangle" },
    { id: "circle" as Tool, icon: Circle, label: "Circle" },
    { id: "line" as Tool, icon: Minus, label: "Line" },
    { id: "triangle" as Tool, icon: Triangle, label: "Triangle" },
    { id: "diamond" as Tool, icon: Diamond, label: "Diamond" },
    { id: "pentagon" as Tool, icon: Pentagon, label: "Pentagon" },
    { id: "hexagon" as Tool, icon: Hexagon, label: "Hexagon" },
    { id: "star" as Tool, icon: Star, label: "Star" },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2 flex items-center gap-1">
      {/* Basic Tools */}
      {basicTools.map((tool) => (
        <Button
          key={tool.id}
          variant={activeTool === tool.id ? "default" : "ghost"}
          size="sm"
          onClick={() => onToolClick(tool.id)}
          className={`h-9 w-9 p-0 ${
            activeTool === tool.id 
              ? "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600" 
              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}
          title={tool.label}
        >
          <tool.icon className="h-4 w-4" />
        </Button>
      ))}

      {/* Shapes Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={shapes.some(s => s.id === activeTool) ? "default" : "ghost"}
            size="sm"
            className={`h-9 w-20 p-0 flex items-center justify-between px-2 ${
              shapes.some(s => s.id === activeTool)
                ? "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600" 
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            <Shapes className="h-4 w-4" />
            <span className="text-xs">Shapes</span>
            <ChevronDown className="h-3 w-3 opacity-70" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <div className="grid grid-cols-2 gap-1 p-1">
            {shapes.map((shape) => (
              <DropdownMenuItem
                key={shape.id}
                onClick={() => onToolClick(shape.id)}
                className={`flex items-center gap-2 px-2 py-1 ${
                  activeTool === shape.id 
                    ? "bg-blue-50 dark:bg-blue-900/20" 
                    : ""
                }`}
              >
                <shape.icon className="h-4 w-4" />
                <span className="text-sm">{shape.label}</span>
              </DropdownMenuItem>
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <Separator orientation="vertical" className="h-6 bg-gray-200 dark:bg-gray-600" />

      {/* Action Tools */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onUndo}
        className="h-9 w-9 p-0 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
        title="Undo"
      >
        <Undo className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={onClear}
        className="h-9 w-9 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
        title="Clear Canvas"
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="h-6 bg-gray-200 dark:bg-gray-600" />

      {/* Zoom Controls */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onZoom('in')}
        className="h-9 w-9 p-0 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
        title="Zoom In"
      >
        <ZoomIn className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => onZoom('out')}
        className="h-9 w-9 p-0 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
        title="Zoom Out"
      >
        <ZoomOut className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="h-6 bg-gray-200 dark:bg-gray-600" />

      {/* AI Assistant */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onShowAI}
        className="h-9 w-9 p-0 text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:text-purple-400 dark:hover:text-purple-300 dark:hover:bg-purple-900/20"
        title="AI Assistant"
      >
        <Sparkles className="h-4 w-4" />
      </Button>

      {/* Export */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onShowExport}
        className="h-9 w-9 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-900/20"
        title="Export"
      >
        <Download className="h-4 w-4" />
      </Button>
    </div>
  );
};
