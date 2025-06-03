
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { X, Download, Link, Image, FileText } from "lucide-react";
import { Canvas as FabricCanvas } from "fabric";
import { toast } from "sonner";

interface ExportPanelProps {
  canvas: FabricCanvas | null;
  onClose: () => void;
}

export const ExportPanel = ({ canvas, onClose }: ExportPanelProps) => {
  const [projectName, setProjectName] = useState("whiteboard-diagram");
  const [shareUrl] = useState(`${window.location.origin}/share/${Math.random().toString(36).substring(7)}`);

  const exportAsPNG = () => {
    if (!canvas) return;
    
    const dataURL = canvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 2,
    });
    
    const link = document.createElement('a');
    link.download = `${projectName}.png`;
    link.href = dataURL;
    link.click();
    
    toast("PNG exported successfully!");
  };

  const exportAsSVG = () => {
    if (!canvas) return;
    
    const svg = canvas.toSVG();
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.download = `${projectName}.svg`;
    link.href = url;
    link.click();
    
    URL.revokeObjectURL(url);
    toast("SVG exported successfully!");
  };

  const exportAsJSON = () => {
    if (!canvas) return;
    
    const json = JSON.stringify(canvas.toJSON());
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.download = `${projectName}.json`;
    link.href = url;
    link.click();
    
    URL.revokeObjectURL(url);
    toast("Project data exported successfully!");
  };

  const copyShareUrl = () => {
    navigator.clipboard.writeText(shareUrl);
    toast("Share URL copied to clipboard!");
  };

  const generateEmbedCode = () => {
    const embedCode = `<iframe src="${shareUrl}" width="800" height="600" frameborder="0"></iframe>`;
    navigator.clipboard.writeText(embedCode);
    toast("Embed code copied to clipboard!");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-96 p-6 bg-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold">Export & Share</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Project Name
            </label>
            <Input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Enter project name"
            />
          </div>
          
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Export Options</h4>
            
            <Button onClick={exportAsPNG} variant="outline" className="w-full justify-start">
              <Image className="h-4 w-4 mr-2" />
              Export as PNG
            </Button>
            
            <Button onClick={exportAsSVG} variant="outline" className="w-full justify-start">
              <FileText className="h-4 w-4 mr-2" />
              Export as SVG
            </Button>
            
            <Button onClick={exportAsJSON} variant="outline" className="w-full justify-start">
              <Download className="h-4 w-4 mr-2" />
              Export Project Data
            </Button>
          </div>
          
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Share & Embed</h4>
            
            <div className="flex gap-2">
              <Input
                value={shareUrl}
                readOnly
                className="text-xs"
              />
              <Button onClick={copyShareUrl} size="sm">
                <Link className="h-4 w-4" />
              </Button>
            </div>
            
            <Button onClick={generateEmbedCode} variant="outline" className="w-full justify-start">
              <FileText className="h-4 w-4 mr-2" />
              Copy Embed Code
            </Button>
          </div>
          
          <div className="text-xs text-gray-500">
            <p>Share URL allows others to view your diagram. Embed code can be used in websites.</p>
          </div>
        </div>
      </Card>
    </div>
  );
};
