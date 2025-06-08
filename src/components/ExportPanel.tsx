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
    <div className="fixed inset-0 bg-black/20 dark:bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <Card className="w-full max-w-2xl mx-4 bg-white dark:bg-slate-900 shadow-lg dark:shadow-slate-900/50 border dark:border-slate-800">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Download className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Export & Import</h2>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              className="hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
            >
              <X className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            </Button>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Project Name</label>
              <Input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 
                  focus:border-blue-500 dark:focus:border-blue-400 rounded-xl
                  text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button
                onClick={exportAsPNG}
                className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80
                  text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700
                  rounded-xl p-4 flex items-center gap-3 transform transition-all duration-200
                  hover:scale-105 active:scale-95 shadow dark:shadow-slate-900/50"
              >
                <Image className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Export as PNG
              </Button>

              <Button
                onClick={exportAsSVG}
                className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80
                  text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700
                  rounded-xl p-4 flex items-center gap-3 transform transition-all duration-200
                  hover:scale-105 active:scale-95 shadow dark:shadow-slate-900/50"
              >
                <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />
                Export as SVG
              </Button>

              <Button
                onClick={exportAsJSON}
                className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80
                  text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700
                  rounded-xl p-4 flex items-center gap-3 transform transition-all duration-200
                  hover:scale-105 active:scale-95 shadow dark:shadow-slate-900/50"
              >
                <Save className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                Export as JSON
              </Button>

              <div className="relative">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImport}
                  accept=".json"
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80
                    text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700
                    rounded-xl p-4 flex items-center gap-3 transform transition-all duration-200
                    hover:scale-105 active:scale-95 shadow dark:shadow-slate-900/50"
                >
                  <Upload className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  Import from JSON
                </Button>
              </div>
            </div>

            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800/50">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Note on Export
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300/80">
                    SVG and PNG exports maintain visual fidelity but cannot be re-imported. Use JSON format to save editable diagrams.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
