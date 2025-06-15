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
  Sun,
  Moon
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
import { ColorPicker } from "./ColorPicker";
import { AIAssistant } from "./AIAssistant";
import { useTheme } from "@/contexts/ThemeContext";

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
  activeColor: string;
  onColorChange: (color: string) => void;
  strokeWidth: number;
  onStrokeWidthChange: (width: number) => void;
  canvas: any;
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
          // Better mobile sizing: very small on phones, medium on tablets, normal on desktop
          "h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 lg:h-10 lg:w-10 rounded-lg transition-all duration-300 transform hover:scale-105 active:scale-95 relative",
          isActive 
            ? `bg-${colorClass}-100 text-${colorClass}-700 hover:bg-${colorClass}-200 dark:bg-${colorClass}-600 dark:text-white dark:hover:bg-${colorClass}-700 shadow-lg shadow-${colorClass}-500/20 dark:shadow-${colorClass}-500/10` 
            : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/50 hover:shadow-md"
        )}
      >
        {/* More responsive icon sizing */}
        <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 lg:h-5 lg:w-5 transform transition-transform duration-200 group-hover:scale-110" />
        {shortcut && (
          <span className="absolute -top-0.5 -right-0.5 bg-gray-800 dark:bg-gray-600 text-white text-xs rounded-full w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 flex items-center justify-center font-medium hidden md:flex">
            <span className="text-[6px] sm:text-[8px] md:text-xs">{shortcut}</span>
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
  onShowExport,
  activeColor,
  onColorChange,
  strokeWidth,
  onStrokeWidthChange,
  canvas
}: ToolbarProps) => {
  const { theme, toggleTheme } = useTheme();

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
    <div
      className={cn(
        // Better mobile responsive width and padding
        "w-full max-w-[95vw] sm:max-w-md md:max-w-2xl lg:max-w-4xl flex flex-row items-center rounded-lg sm:rounded-xl md:rounded-2xl px-1.5 sm:px-2 md:px-4 py-1 sm:py-1.5 md:py-2 mt-1 sm:mt-2 shadow-lg",
        "bg-white/90 dark:bg-[#363d47]",
        "border border-gray-200 dark:border-none",
        "backdrop-blur-sm mx-auto"
      )}
    >
      {/* Toolbar buttons */}
      <div className="flex flex-row items-center gap-0.5 sm:gap-1 md:gap-2">
        {basicTools.slice(0, 2).map((tool) => (
          <ToolButton
            key={tool.id}
            isActive={activeTool === tool.id}
            onClick={() => onToolClick(tool.id)}
            icon={tool.icon}
            label={tool.label}
            tooltip={tool.tooltip}
            colorClass="blue"
            shortcut={ICON_SHORTCUTS[tool.id]}
          />
        ))}
        {/* Shapes Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant={shapes.some(s => s.id === activeTool) ? "default" : "ghost"}
              size="sm"
              className={cn(
                // Better mobile sizing for shapes button
                "h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 lg:h-10 lg:w-10 rounded-lg flex items-center justify-center relative",
                "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-[#4a5361] dark:text-white dark:hover:bg-[#5a6473]",
                shapes.some(s => s.id === activeTool) && "ring-2 ring-blue-400"
              )}
            >
              <Shapes className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 lg:h-5 lg:w-5" />
              <span className="absolute -top-0.5 -right-0.5 bg-gray-800 dark:bg-gray-600 text-white text-xs rounded-full w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 flex items-center justify-center font-medium hidden md:flex">
                <span className="text-[6px] sm:text-[8px] md:text-xs">▼</span>
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className={cn(
              "border border-gray-200 rounded-xl shadow-xl mt-2 p-2 min-w-[140px] sm:min-w-[160px] md:min-w-[180px]",
              "bg-white text-gray-800 dark:bg-[#23272f] dark:text-white dark:border-none"
            )}
          >
            {/* More compact mobile grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1 sm:gap-2">
              {shapes.map((shape) => (
                <DropdownMenuItem
                  key={shape.id}
                  onClick={() => onToolClick(shape.id)}
                  className={cn(
                    "flex flex-col items-center gap-1 px-1 sm:px-2 py-1.5 sm:py-2 rounded-lg cursor-pointer relative",
                    "text-gray-700 hover:bg-gray-100 dark:text-white dark:hover:bg-[#363d47]",
                    activeTool === shape.id
                      ? "bg-blue-50 ring-2 ring-blue-400 dark:bg-[#2d3340]"
                      : ""
                  )}
                >
                  <shape.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                  <span className="text-[9px] sm:text-[10px] md:text-xs text-center">{shape.label}</span>
                  {ICON_SHORTCUTS[shape.id] && (
                    <span className="absolute -top-0.5 -right-0.5 bg-gray-800 dark:bg-gray-600 text-white text-xs rounded-full w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 flex items-center justify-center font-medium hidden md:flex">
                      <span className="text-[6px] sm:text-[8px] md:text-xs">{ICON_SHORTCUTS[shape.id]}</span>
                    </span>
                  )}
                </DropdownMenuItem>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
        {basicTools.slice(2).map((tool) => (
          <ToolButton
            key={tool.id}
            isActive={activeTool === tool.id}
            onClick={() => onToolClick(tool.id)}
            icon={tool.icon}
            label={tool.label}
            tooltip={tool.tooltip}
            colorClass="blue"
            shortcut={ICON_SHORTCUTS[tool.id]}
          />
        ))}
      </div>
      {/* Spacer */}
      <div className="flex-1" />
      {/* Action buttons - More selective hiding on mobile */}
      <div className="flex flex-row items-center gap-0.5 sm:gap-1 md:gap-2">
        <ToolButton onClick={onUndo} icon={Undo} label="Undo" colorClass="blue" />
        <ToolButton onClick={onClear} icon={Trash2} label="Clear" colorClass="red" />
        {/* Hide zoom buttons only on very small phones */}
        <div className="hidden sm:flex gap-0.5 sm:gap-1 md:gap-2">
          <ToolButton onClick={() => onZoom('in')} icon={ZoomIn} label="Zoom In" colorClass="blue" />
          <ToolButton onClick={() => onZoom('out')} icon={ZoomOut} label="Zoom Out" colorClass="blue" />
        </div>
        <ToolButton onClick={onShowExport} icon={Download} label="Export" colorClass="green" />
        {/* Settings popover */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 lg:h-10 lg:w-10 rounded-lg",
                "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-[#23272f] dark:text-white dark:hover:bg-[#363d47]"
              )}
            >
              <ChevronDown className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 lg:h-5 lg:w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className={cn(
              "border border-gray-200 rounded-xl shadow-xl mt-2 p-3 sm:p-4 w-56 sm:w-64 md:min-w-[280px]",
              "bg-white text-gray-800 dark:bg-[#23272f] dark:text-white dark:border-none"
            )}
          >
            <div className="space-y-3 sm:space-y-4">
              {/* Color Picker Section */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-800 dark:text-white">Color</h4>
                <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                  {[
                    "#1e40af", "#dc2626", "#059669", "#d97706", "#7c3aed", 
                    "#be185d", "#0891b2", "#65a30d", "#000000", "#6b7280"
                  ].map((color) => (
                    <button
                      key={color}
                      className={cn(
                        "w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-md border-2 transition-all duration-200",
                        activeColor === color 
                          ? "border-blue-500 ring-2 ring-blue-400" 
                          : "border-gray-200 hover:border-blue-400 dark:border-[#4a5361]"
                      )}
                      style={{ backgroundColor: color }}
                      onClick={() => onColorChange(color)}
                    />
                  ))}
                </div>
                <input
                  type="color"
                  value={activeColor}
                  onChange={(e) => onColorChange(e.target.value)}
                  className={cn(
                    "w-full h-7 sm:h-8 rounded-md cursor-pointer border border-gray-200",
                    "bg-gray-50 dark:bg-[#363d47] dark:border-none"
                  )}
                />
              </div>

              <Separator className="bg-gray-200 dark:bg-[#4a5361]" />

              {/* Stroke Width Section */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-800 dark:text-white">Stroke Width</h4>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={strokeWidth}
                    onChange={(e) => onStrokeWidthChange(parseInt(e.target.value))}
                    className={cn(
                      "flex-1 h-2 rounded-lg appearance-none cursor-pointer",
                      "bg-gray-100 dark:bg-[#363d47]"
                    )}
                  />
                  <span className="text-gray-700 dark:text-white text-sm w-8 text-center">{strokeWidth}px</span>
                </div>
              </div>

              <Separator className="bg-gray-200 dark:bg-[#4a5361]" />

              {/* Mobile zoom controls - always show on small screens */}
              <div className="space-y-2 sm:hidden">
                <h4 className="text-sm font-medium text-gray-800 dark:text-white">Zoom</h4>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onZoom('in')}
                    className="flex-1 gap-2 text-gray-700 hover:bg-gray-100 dark:text-white dark:hover:bg-[#363d47]"
                  >
                    <ZoomIn className="h-4 w-4" />
                    <span>Zoom In</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onZoom('out')}
                    className="flex-1 gap-2 text-gray-700 hover:bg-gray-100 dark:text-white dark:hover:bg-[#363d47]"
                  >
                    <ZoomOut className="h-4 w-4" />
                    <span>Zoom Out</span>
                  </Button>
                </div>
                <Separator className="bg-gray-200 dark:bg-[#4a5361]" />
              </div>

              {/* Theme Toggle Section */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-800 dark:text-white">Theme</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleTheme}
                  className={cn(
                    "w-full justify-start gap-2",
                    "text-gray-700 hover:bg-gray-100 dark:text-white dark:hover:bg-[#363d47]"
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

              <Separator className="bg-gray-200 dark:bg-[#4a5361]" />

              {/* AI Assistant Section */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-800 dark:text-white">AI Assistant</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onShowAI}
                  className={cn(
                    "w-full justify-start gap-2",
                    "text-gray-700 hover:bg-gray-100 dark:text-white dark:hover:bg-[#363d47]"
                  )}
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Open AI Assistant</span>
                </Button>
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
