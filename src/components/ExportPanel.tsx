import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { X, Download, Link, Image, FileText, Upload, Save, AlertTriangle } from "lucide-react";
import { Canvas as FabricCanvas } from "fabric";
import { toast } from "sonner";

interface ExportPanelProps {
  canvas: FabricCanvas | null;
  onClose: () => void;
}

export const ExportPanel = ({ canvas, onClose }: ExportPanelProps) => {
  const [projectName, setProjectName] = useState("whiteboard-diagram");
  const [shareUrl] = useState(`${window.location.origin}/share/${Math.random().toString(36).substring(7)}`);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    
    try {
      // Get the JSON representation of the canvas
      const json = JSON.stringify(canvas.toJSON(), null, 2);
      
      // Create a blob and download link
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.download = `${projectName}.json`;
      link.href = url;
      link.click();
      
      URL.revokeObjectURL(url);
      toast.success("Project exported as JSON successfully! This file can be imported later with full editability.");
    } catch (error) {
      toast.error("Error exporting project. Please try again.");
      console.error("Export error:", error);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canvas || !e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    
    if (!file.name.endsWith('.json')) {
      toast.error("Please select a JSON file. Only JSON files can be imported for full editability.");
      return;
    }

    const reader = new FileReader();

    reader.onload = async (event) => {
      if (!event.target?.result) return;

      try {
        const jsonData = JSON.parse(event.target.result as string);
        
        // Clear the current canvas
        canvas.clear();

        // Load the JSON data into the canvas
        canvas.loadFromJSON(jsonData, () => {
          // Make all objects fully editable
          canvas.getObjects().forEach(obj => {
            obj.set({
              selectable: true,
              evented: true,
              lockMovementX: false,
              lockMovementY: false,
              lockRotation: false,
              lockScalingX: false,
              lockScalingY: false,
              hasControls: true,
              hasBorders: true
            });
          });

          // Center view on the imported content
          canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
          canvas.renderAll();
          
          // Set the project name from the imported file
          const fileName = file.name.split('.')[0];
          setProjectName(fileName);
          
          toast.success("Project imported successfully! All items are now editable.");
        });

      } catch (error) {
        toast.error("Error importing file. Please make sure it's a valid JSON project file.");
        console.error("Import error:", error);
      }
    };

    reader.readAsText(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
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
            <h4 className="text-sm font-medium text-gray-700">Import & Export Options</h4>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImport}
              accept=".json"
              className="hidden"
            />
            
            <div className="bg-yellow-50 p-3 rounded-md mb-3">
              <div className="flex items-start">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 mr-2" />
                <p className="text-xs text-yellow-800">
                  Warning: Importing a file will clear your current canvas. Please export your current work before importing if you want to keep it.
                </p>
              </div>
            </div>
            
            <Button onClick={triggerFileInput} variant="outline" className="w-full justify-start">
              <Upload className="h-4 w-4 mr-2" />
              Import Project (JSON)
            </Button>

            <Button onClick={exportAsJSON} variant="outline" className="w-full justify-start text-blue-600">
              <Save className="h-4 w-4 mr-2" />
              Export as JSON (Editable)
            </Button>

            <div className="border-t border-gray-200 my-2"></div>

            <Button onClick={exportAsPNG} variant="outline" className="w-full justify-start">
              <Image className="h-4 w-4 mr-2" />
              Export as PNG
            </Button>
            
            <Button onClick={exportAsSVG} variant="outline" className="w-full justify-start">
              <FileText className="h-4 w-4 mr-2" />
              Export as SVG
            </Button>

            <div className="mt-3 text-xs text-gray-500 bg-gray-50 p-2 rounded">
              <p>Note: Only JSON format preserves editability. PNG and SVG exports are for viewing purposes only and cannot be imported for editing.</p>
            </div>
            
          </div>
        </div>
      </Card>
    </div>
  );
};
