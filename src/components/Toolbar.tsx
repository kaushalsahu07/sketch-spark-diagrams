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
import {
  HoverCard,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";

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
  <HoverCard openDelay={300}>
    <HoverCardTrigger asChild>
      <Button
        variant={isActive ? "default" : "ghost"}
        size="sm"
        onClick={onClick}
        className={cn(
          "relative h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-300 transform hover:scale-105 active:scale-95 p-0",
          isActive 
            ? `bg-${colorClass}-600 text-white hover:bg-${colorClass}-700 dark:bg-${colorClass}-500 dark:hover:bg-${colorClass}-600 shadow-lg shadow-${colorClass}-500/20 dark:shadow-${colorClass}-500/10` 
            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:shadow-md"
        )}
      >
        <Icon className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
        {shortcut && (
          <span className="absolute top-1 right-1 px-1 py-0 rounded-full text-[8px] font-semibold bg-gray-200/90 dark:bg-gray-700/80 text-gray-600 dark:text-gray-300 shadow-sm border border-gray-300/60 dark:border-gray-600/60 select-none pointer-events-none" style={{lineHeight: '1.1'}}>
            {shortcut}
          </span>
        )}
      </Button>
    </HoverCardTrigger>
  </HoverCard>
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
  console.log("Toolbar activeTool:", activeTool);
  const basicTools = [
    { 
      id: "select" as Tool, 
      icon: MousePointer, 
      label: "Select", 
      tooltip: "Click and drag to select, move, and resize objects on the canvas" 
    },
    { 
      id: "draw" as Tool, 
      icon: Pencil, 
      label: "Draw",
      tooltip: "Freehand drawing tool. Click and drag to create custom shapes" 
    },
    { 
      id: "text" as Tool, 
      icon: Type, 
      label: "Text",
      tooltip: "Add text to your diagram. Double-click existing text to edit" 
    },
    { 
      id: "eraser" as Tool, 
      icon: Eraser, 
      label: "Reality Eraser",
      tooltip: "Erase any part of your drawing by clicking and dragging" 
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
    <div className="fixed top-4 left-1/2 -translate-x-1/2 transform z-50">
      <div className="bg-gradient-to-b from-white/95 to-white/90 dark:from-gray-800/95 dark:to-gray-800/90 backdrop-blur-xl rounded-2xl shadow-lg shadow-black/5 dark:shadow-white/5 border border-gray-200/20 dark:border-gray-700/20 p-3 flex items-center gap-3">
        {/* Basic Tools */}
        <div className="flex items-center gap-2">
          {basicTools.map((tool) => (
            <ToolButton
              key={tool.id}
              isActive={activeTool === tool.id}
              onClick={() => onToolClick(tool.id)}
              icon={tool.icon}
              label={tool.label}
              tooltip={tool.tooltip}
              shortcut={ICON_SHORTCUTS[tool.id]}
            />
          ))}
        </div>

        {/* Shapes Dropdown */}
        <HoverCard openDelay={300}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <HoverCardTrigger asChild>
                <Button
                  variant={shapes.some(s => s.id === activeTool) ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "h-10 rounded-xl px-4 flex items-center gap-2 transition-all duration-300 transform hover:scale-105 active:scale-95",
                    shapes.some(s => s.id === activeTool)
                      ? "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 shadow-lg shadow-blue-500/20 dark:shadow-blue-500/10" 
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:shadow-md"
                  )}
                >
                  <Shapes className="h-5 w-5 transform transition-transform duration-200 group-hover:scale-110" />
                  <span className="text-sm font-medium">Shapes</span>
                  <ChevronDown className="h-4 w-4 opacity-70" />
                </Button>
              </HoverCardTrigger>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="start" 
              className="p-2 bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg border-gray-200/20 dark:border-gray-700/20 rounded-xl shadow-xl"
            >
              <div className="grid grid-cols-2 gap-2 min-w-[240px]">
                {shapes.map((shape) => (
                  <DropdownMenuItem
                    key={shape.id}
                    onClick={() => onToolClick(shape.id)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200",
                      activeTool === shape.id 
                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" 
                        : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    )}
                  >
                    <shape.icon className="h-5 w-5" />
                    <span className="text-sm font-medium flex-1">{shape.label}</span>
                    {ICON_SHORTCUTS[shape.id] && (
                      <span className="ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-gray-200/90 dark:bg-gray-700/80 text-gray-600 dark:text-gray-300 border border-gray-300/60 dark:border-gray-600/60 select-none pointer-events-none" style={{lineHeight: '1.1'}}>
                        {ICON_SHORTCUTS[shape.id]}
                      </span>
                    )}
                  </DropdownMenuItem>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </HoverCard>

        <Separator orientation="vertical" className="h-8 bg-gray-200/50 dark:bg-gray-600/50" />

        {/* Action Tools */}
        <div className="flex items-center gap-2">
          <ToolButton
            onClick={onUndo}
            icon={Undo}
            label="Undo"
            tooltip="Undo your last action (Ctrl/Cmd + Z)"
          />
          <ToolButton
            onClick={onClear}
            icon={Trash2}
            label="Clear Canvas"
            colorClass="red"
            tooltip="Clear the entire canvas (This action cannot be undone)"
          />
        </div>

        <Separator orientation="vertical" className="h-8 bg-gray-200/50 dark:bg-gray-600/50" />

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <ToolButton
            onClick={() => onZoom('in')}
            icon={ZoomIn}
            label="Zoom In"
            tooltip="Zoom in to see more details (Ctrl/Cmd + +)"
          />
          <ToolButton
            onClick={() => onZoom('out')}
            icon={ZoomOut}
            label="Zoom Out"
            tooltip="Zoom out to see more of the canvas (Ctrl/Cmd + -)"
          />
        </div>

        <Separator orientation="vertical" className="h-8 bg-gray-200/50 dark:bg-gray-600/50" />

        {/* Feature Tools */}
        <div className="flex items-center gap-2">
          <ToolButton
            onClick={onShowAI}
            icon={Sparkles}
            label="AI Assistant"
            colorClass="purple"
            tooltip="Get help from our AI Assistant to improve your diagrams"
          />
          <ToolButton
            onClick={onShowExport}
            icon={Download}
            label="Export"
            colorClass="green"
            tooltip="Export your diagram as an image or editable JSON file"
          />
        </div>
      </div>
    </div>
  );
};
