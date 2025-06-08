
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Upload, FileImage, FileText, Share2 } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";
import * as fabric from "fabric";

interface ExportImportSidebarProps {
  canvas: fabric.Canvas | null;
}

export const ExportImportSidebar = ({ canvas }: ExportImportSidebarProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { theme } = useTheme();

  const handleExportPNG = () => {
    if (!canvas) return;
    
    const dataURL = canvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 2,
    });
    
    const link = document.createElement('a');
    link.download = `canvas-${Date.now()}.png`;
    link.href = dataURL;
    link.click();
    toast("Exported as PNG!");
  };

  const handleExportJSON = () => {
    if (!canvas) return;
    
    const jsonData = JSON.stringify(canvas.toJSON(), null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.download = `canvas-${Date.now()}.json`;
    link.href = url;
    link.click();
    
    URL.revokeObjectURL(url);
    toast("Exported as JSON!");
  };

  const handleImportJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !canvas) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target?.result as string);
        canvas.loadFromJSON(jsonData, () => {
          canvas.renderAll();
          toast("Canvas imported successfully!");
        });
      } catch (error) {
        toast("Error importing file!");
      }
    };
    reader.readAsText(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleShare = () => {
    if (!canvas) return;
    
    // For now, just copy canvas data to clipboard
    const jsonData = JSON.stringify(canvas.toJSON());
    navigator.clipboard.writeText(jsonData).then(() => {
      toast("Canvas data copied to clipboard!");
    }).catch(() => {
      toast("Failed to copy to clipboard");
    });
  };

  return (
    <Card className="w-full bg-background/95 backdrop-blur border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Download className="w-5 h-5" />
          Export & Import
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Export Options:</p>
          <div className="grid grid-cols-1 gap-2">
            <Button 
              onClick={handleExportPNG}
              variant="outline"
              className="justify-start"
            >
              <FileImage className="w-4 h-4 mr-2" />
              Export as PNG
            </Button>
            <Button 
              onClick={handleExportJSON}
              variant="outline"
              className="justify-start"
            >
              <FileText className="w-4 h-4 mr-2" />
              Export as JSON
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Import Options:</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportJSON}
            className="hidden"
          />
          <Button 
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            className="w-full justify-start"
          >
            <Upload className="w-4 h-4 mr-2" />
            Import JSON
          </Button>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Share:</p>
          <Button 
            onClick={handleShare}
            variant="outline"
            className="w-full justify-start"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Copy to Clipboard
          </Button>
        </div>

        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Tip: Use JSON format to preserve all canvas data including layers and properties.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
