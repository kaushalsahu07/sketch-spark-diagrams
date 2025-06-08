
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Sun, 
  Moon, 
  Palette, 
  Settings,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { AISidebar } from "./AISidebar";
import { ExportImportSidebar } from "./ExportImportSidebar";
import { ColorPicker } from "./ColorPicker";

interface LeftSidebarProps {
  canvas: fabric.Canvas | null;
  activeColor: string;
  strokeWidth: number;
  onColorChange: (color: string) => void;
  onStrokeWidthChange: (width: number) => void;
}

export const LeftSidebar = ({ 
  canvas, 
  activeColor, 
  strokeWidth, 
  onColorChange, 
  onStrokeWidthChange 
}: LeftSidebarProps) => {
  const { theme, toggleTheme } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (isCollapsed) {
    return (
      <div className="fixed left-0 top-0 z-30 h-full w-12 bg-background/95 backdrop-blur border-r border-border flex flex-col items-center py-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(false)}
          className="w-8 h-8 p-0"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed left-0 top-0 z-30 h-full w-80 bg-background/95 backdrop-blur border-r border-border">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">Controls</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(true)}
          className="w-8 h-8 p-0"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-64px)]">
        <div className="p-4 space-y-6">
          {/* Theme Toggle Section */}
          <Card className="bg-background/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-foreground text-base">
                {theme === 'light' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                Theme
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">
                  {theme === 'light' ? 'Light Mode' : 'Dark Mode'}
                </span>
                <Switch
                  checked={theme === 'dark'}
                  onCheckedChange={toggleTheme}
                />
              </div>
            </CardContent>
          </Card>

          {/* Color and Stroke Settings */}
          <Card className="bg-background/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-foreground text-base">
                <Palette className="w-4 h-4" />
                Drawing Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ColorPicker
                color={activeColor}
                onChange={onColorChange}
                strokeWidth={strokeWidth}
                onStrokeWidthChange={onStrokeWidthChange}
              />
            </CardContent>
          </Card>

          <Separator />

          {/* AI Section */}
          <AISidebar canvas={canvas} activeColor={activeColor} />

          <Separator />

          {/* Export/Import Section */}
          <ExportImportSidebar canvas={canvas} />
        </div>
      </ScrollArea>
    </div>
  );
};
