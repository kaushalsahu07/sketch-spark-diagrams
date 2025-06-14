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
  ChevronDown,
  MoreHorizontal
} from "lucide-react";
import { Tool } from "./Canvas";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  HoverCard,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

const ICON_SHORTCUTS: Record<string, string> = {
  select: '1',
  rectangle: 'r',
  diamond: 'd',
  circle: 'c',
  line: 'l',
  triangle: '3',
  pencil: '2',
  text: 't',    
  eraser: '0',
  star: 's',
  pentagon: 'p',
  hexagon: 'h',
};

interface ToolbarProps {
  activeTool: Tool;
  onToolClick: (tool: Tool) => void;
  onClear: () => void;
  onUndo: () => void;
  onZoom: (direction: 'in' | 'out') => void;
  onShowAI: () => void;
  onShowExport: () => void;
}

interface ToolButtonProps {
  isActive?: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
  colorClass?: string;
  tooltip?: string;
}

const ToolButton: React.FC<ToolButtonProps & { shortcut?: string }> = ({ 
  isActive, 
  onClick, 
  icon: Icon,  
  colorClass = "blue", 
  shortcut
}) => (
  <Button
    variant={isActive ? "default" : "ghost"}
    size="sm"
    onClick={onClick}
    className={cn(
      "h-8 w-8 sm:h-9 sm:w-9 rounded-lg transition-all duration-200",
      isActive 
        ? `bg-${colorClass}-600 text-white hover:bg-${colorClass}-700 dark:bg-${colorClass}-500 dark:hover:bg-${colorClass}-600 shadow-md` 
        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
    )}
  >
    <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
  </Button>
);

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
    { 
      id: "select" as Tool, 
      icon: MousePointer, 
      label: "Select"
    },
    { 
      id: "draw" as Tool, 
      icon: Pencil, 
      label: "Draw"
    },
    { 
      id: "text" as Tool, 
      icon: Type, 
      label: "Text"
    },
    { 
      id: "eraser" as Tool, 
      icon: Eraser, 
      label: "Eraser"
    },
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
    <div className="w-full max-w-none overflow-x-auto">
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-lg sm:rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-2 flex items-center gap-1 sm:gap-2 min-w-max mx-auto">
        
        {/* Essential Tools - Always visible */}
        <div className="flex items-center gap-1">
          {basicTools.slice(0, 2).map((tool) => (
            <ToolButton
              key={tool.id}
              isActive={activeTool === tool.id}
              onClick={() => onToolClick(tool.id)}
              icon={tool.icon}
              label={tool.label}
            />
          ))}
        </div>

        {/* Shapes Dropdown - Compact */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant={shapes.some(s => s.id === activeTool) ? "default" : "ghost"}
              size="sm"
              className={cn(
                "h-8 w-8 sm:h-9 sm:w-9 rounded-lg transition-all duration-200",
                shapes.some(s => s.id === activeTool)
                  ? "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 shadow-md" 
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              )}
            >
              <Shapes className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="center" 
            className="p-2 bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg border-gray-200/50 dark:border-gray-700/50 rounded-lg shadow-xl"
          >
            <div className="grid grid-cols-2 gap-1 w-48">
              {shapes.map((shape) => (
                <DropdownMenuItem
                  key={shape.id}
                  onClick={() => onToolClick(shape.id)}
                  className={cn(
                    "flex items-center gap-2 px-2 py-1.5 rounded-md transition-all duration-200",
                    activeTool === shape.id 
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" 
                      : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  )}
                >
                  <shape.icon className="h-4 w-4" />
                  <span className="text-sm">{shape.label}</span>
                </DropdownMenuItem>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* More Tools Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant={[basicTools[2], basicTools[3]].some(t => t.id === activeTool) ? "default" : "ghost"}
              size="sm"
              className={cn(
                "h-8 w-8 sm:h-9 sm:w-9 rounded-lg transition-all duration-200",
                [basicTools[2], basicTools[3]].some(t => t.id === activeTool)
                  ? "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 shadow-md" 
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              )}
            >
              <MoreHorizontal className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg rounded-lg">
            {basicTools.slice(2).map((tool) => (
              <DropdownMenuItem
                key={tool.id}
                onClick={() => onToolClick(tool.id)}
                className={cn(
                  "flex items-center gap-2",
                  activeTool === tool.id && "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                )}
              >
                <tool.icon className="h-4 w-4" />
                <span>{tool.label}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Separator orientation="vertical" className="h-6 bg-gray-200 dark:bg-gray-600" />

        {/* Action Tools */}
        <div className="flex items-center gap-1">
          <ToolButton
            onClick={onUndo}
            icon={Undo}
            label="Undo"
          />
          <ToolButton
            onClick={onClear}
            icon={Trash2}
            label="Clear"
            colorClass="red"
          />
        </div>

        {/* Feature Controls Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Download className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg rounded-lg">
            <DropdownMenuItem onClick={() => onZoom('in')} className="flex items-center gap-2">
              <ZoomIn className="h-4 w-4" />
              <span>Zoom In</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onZoom('out')} className="flex items-center gap-2">
              <ZoomOut className="h-4 w-4" />
              <span>Zoom Out</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onShowAI} className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <span>AI Assistant</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onShowExport} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              <span>Export</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
