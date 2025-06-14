
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { HoverCard, HoverCardTrigger } from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";
import { SettingsMenu } from "./SettingsMenu";

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
  color: string;
  onColorChange: (color: string) => void;
  strokeWidth: number;
  onStrokeWidthChange: (width: number) => void;
}

interface ToolButtonProps {
  isActive?: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
}

const ToolButton: React.FC<ToolButtonProps & { shortcut?: string }> = ({
  isActive,
  onClick,
  icon: Icon,
}) => (
  <Button
    variant={isActive ? "default" : "ghost"}
    size="icon"
    onClick={onClick}
    className={cn(
      "h-10 w-10 rounded-xl flex items-center justify-center transition hover:bg-gray-600/80 hover:text-white",
      isActive
        ? "bg-blue-600 text-white"
        : "bg-transparent text-gray-200"
    )}
  >
    <Icon className="h-5 w-5" />
  </Button>
);

export const Toolbar = ({
  activeTool,
  onToolClick,
  onClear,
  onUndo,
  onZoom,
  onShowAI,
  onShowExport,
  color,
  onColorChange,
  strokeWidth,
  onStrokeWidthChange,
}: ToolbarProps) => {
  const basicTools = [
    { id: "select" as Tool, icon: MousePointer, label: "Select" },
    { id: "draw" as Tool, icon: Pencil, label: "Draw" },
    { id: "text" as Tool, icon: Type, label: "Text" },
    { id: "eraser" as Tool, icon: Eraser, label: "Eraser" },
  ];

  const shapes = [
    { id: "rectangle" as Tool, icon: Square },
    { id: "circle" as Tool, icon: Circle },
    { id: "line" as Tool, icon: Minus },
    { id: "triangle" as Tool, icon: Triangle },
    { id: "diamond" as Tool, icon: Diamond },
    { id: "pentagon" as Tool, icon: Pentagon },
    { id: "hexagon" as Tool, icon: Hexagon },
    { id: "star" as Tool, icon: Star },
  ];

  return (
    <div className="fixed top-4 left-4 right-4 z-50">
      <div className="flex items-center px-4 py-2 gap-2 bg-gray-700 dark:bg-gray-700/95 rounded-3xl shadow-lg max-w-5xl mx-auto">
        <div className="flex items-center gap-1">
          <ToolButton
            isActive={activeTool === "select"}
            onClick={() => onToolClick("select")}
            icon={MousePointer}
            label="Select"
          />
          <ToolButton
            isActive={activeTool === "draw"}
            onClick={() => onToolClick("draw")}
            icon={Pencil}
            label="Draw"
          />
          <HoverCard openDelay={200}>
            <HoverCardTrigger asChild>
              <Button
                variant={shapes.some(s => s.id === activeTool) ? "default" : "ghost"}
                size="icon"
                className={cn(
                  "h-10 w-10 rounded-xl bg-transparent text-gray-200 hover:bg-gray-600/80 flex items-center justify-center",
                  shapes.some(s => s.id === activeTool) && "bg-blue-600 text-white"
                )}
              >
                <Shapes className="h-5 w-5" />
              </Button>
            </HoverCardTrigger>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <span />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="bg-gray-800 text-gray-100 rounded-xl shadow-xl p-2"
              >
                <div className="grid grid-cols-4 gap-2 w-48">
                  {shapes.map((shape) => (
                    <DropdownMenuItem
                      key={shape.id}
                      onClick={() => onToolClick(shape.id)}
                      className={cn(
                        "flex items-center justify-center h-10 w-10 rounded-lg transition-all",
                        activeTool === shape.id
                          ? "bg-blue-600 text-white"
                          : "hover:bg-gray-600 hover:text-white"
                      )}
                    >
                      <shape.icon className="h-5 w-5" />
                    </DropdownMenuItem>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </HoverCard>
        </div>

        <Separator orientation="vertical" className="h-8 bg-gray-600 mx-2" />

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
          />
          <ToolButton
            onClick={onShowExport}
            icon={Download}
            label="Export"
          />
        </div>

        <div className="flex-1" />

        <SettingsMenu
          color={color}
          onColorChange={onColorChange}
          strokeWidth={strokeWidth}
          onStrokeWidthChange={onStrokeWidthChange}
        />
      </div>
    </div>
  );
};
