import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas, Circle, Rect, Line, Textbox, Path } from "fabric";
import { Toolbar } from "./Toolbar";
import { ColorPicker } from "./ColorPicker";
import { AIAssistant } from "./AIAssistant";
import { ExportPanel } from "./ExportPanel";
import { toast } from "sonner";

export type Tool = "select" | "draw" | "rectangle" | "circle" | "line" | "text" | "arrow";

export const Canvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [activeColor, setActiveColor] = useState("#1e40af");
  const [activeTool, setActiveTool] = useState<Tool>("select");
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [showExport, setShowExport] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: "#ffffff",
    });

    setFabricCanvas(canvas);
    toast("Canvas ready! Start creating your diagram!");

    const handleResize = () => {
      canvas.setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
      canvas.renderAll();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.dispose();
    };
  }, []);

  useEffect(() => {
    if (!fabricCanvas) return;

    fabricCanvas.isDrawingMode = activeTool === "draw";
    
    // Only set brush properties if drawing mode is enabled and brush exists
    if (activeTool === "draw" && fabricCanvas.freeDrawingBrush) {
      fabricCanvas.freeDrawingBrush.color = activeColor;
      fabricCanvas.freeDrawingBrush.width = strokeWidth;
    }
  }, [activeTool, activeColor, strokeWidth, fabricCanvas]);

  const addShape = (shapeType: string) => {
    if (!fabricCanvas) return;

    const centerX = fabricCanvas.width! / 2;
    const centerY = fabricCanvas.height! / 2;

    switch (shapeType) {
      case "rectangle":
        const rect = new Rect({
          left: centerX - 50,
          top: centerY - 25,
          fill: "transparent",
          stroke: activeColor,
          strokeWidth: strokeWidth,
          width: 100,
          height: 50,
        });
        fabricCanvas.add(rect);
        break;
      
      case "circle":
        const circle = new Circle({
          left: centerX - 25,
          top: centerY - 25,
          fill: "transparent",
          stroke: activeColor,
          strokeWidth: strokeWidth,
          radius: 25,
        });
        fabricCanvas.add(circle);
        break;
      
      case "line":
        const line = new Line([centerX - 50, centerY, centerX + 50, centerY], {
          stroke: activeColor,
          strokeWidth: strokeWidth,
        });
        fabricCanvas.add(line);
        break;
      
      case "text":
        const text = new Textbox("Double click to edit", {
          left: centerX - 75,
          top: centerY - 10,
          fill: activeColor,
          fontSize: 16,
          fontFamily: "Inter, sans-serif",
        });
        fabricCanvas.add(text);
        break;
    }
    
    fabricCanvas.renderAll();
    setActiveTool("select");
  };

  const handleToolClick = (tool: Tool) => {
    setActiveTool(tool);

    if (["rectangle", "circle", "line", "text"].includes(tool)) {
      addShape(tool);
    }
  };

  const handleClear = () => {
    if (!fabricCanvas) return;
    fabricCanvas.clear();
    fabricCanvas.backgroundColor = "#ffffff";
    fabricCanvas.renderAll();
    toast("Canvas cleared!");
  };

  const handleUndo = () => {
    // Basic undo functionality - in a real app you'd implement a proper history system
    const objects = fabricCanvas?.getObjects();
    if (objects && objects.length > 0) {
      fabricCanvas?.remove(objects[objects.length - 1]);
      fabricCanvas?.renderAll();
    }
  };

  const handleZoom = (direction: 'in' | 'out') => {
    if (!fabricCanvas) return;
    const zoom = fabricCanvas.getZoom();
    const newZoom = direction === 'in' ? zoom * 1.1 : zoom * 0.9;
    fabricCanvas.setZoom(Math.min(Math.max(newZoom, 0.1), 5));
    fabricCanvas.renderAll();
  };

  return (
    <div className="relative w-full h-screen bg-gray-50 overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0" />
      
      {/* Floating Toolbar */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
        <Toolbar 
          activeTool={activeTool} 
          onToolClick={handleToolClick}
          onClear={handleClear}
          onUndo={handleUndo}
          onZoom={handleZoom}
          onShowAI={() => setShowAI(true)}
          onShowExport={() => setShowExport(true)}
        />
      </div>

      {/* Color Picker & Settings */}
      <div className="absolute top-4 right-4 z-10">
        <ColorPicker 
          color={activeColor} 
          onChange={setActiveColor}
          strokeWidth={strokeWidth}
          onStrokeWidthChange={setStrokeWidth}
        />
      </div>

      {/* AI Assistant Panel */}
      {showAI && (
        <AIAssistant 
          canvas={fabricCanvas}
          onClose={() => setShowAI(false)}
          activeColor={activeColor}
        />
      )}

      {/* Export Panel */}
      {showExport && (
        <ExportPanel 
          canvas={fabricCanvas}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  );
};
