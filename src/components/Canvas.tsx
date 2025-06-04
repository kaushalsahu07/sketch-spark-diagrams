
import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas, Circle, Rect, Line, Textbox, Path, PencilBrush, Object as FabricObject } from "fabric";
import { Toolbar } from "./Toolbar";
import { ColorPicker } from "./ColorPicker";
import { DesignPanel } from "./DesignPanel";
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

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const dpr = window.devicePixelRatio || 1;
    
    const canvas = new FabricCanvas(canvasRef.current, {
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: "#ffffff",
      isDrawingMode: false,
      enableRetinaScaling: true,
      devicePixelRatio: dpr,
      preserveObjectStacking: true,
      perPixelTargetFind: true,
      targetFindTolerance: 4,
      selectionKey: 'shiftKey',
      altSelectionKey: 'altKey',
    });

    // Set up selection behavior for overlapping objects
    canvas.on('mouse:down', (options) => {
      if (!options.target) return;

      // If alt key is pressed, cycle through overlapping objects
      if (options.e.altKey && options.target) {
        const clickPoint = canvas.getPointer(options.e);
        const objects = canvas.getObjects().filter(obj => {
          const bound = obj.getBoundingRect();
          return clickPoint.x >= bound.left && 
                 clickPoint.x <= bound.left + bound.width &&
                 clickPoint.y >= bound.top && 
                 clickPoint.y <= bound.top + bound.height;
        });

        if (objects.length > 1) {
          const currentIndex = objects.indexOf(options.target);
          const nextIndex = (currentIndex + 1) % objects.length;
          canvas.setActiveObject(objects[nextIndex]);
          canvas.requestRenderAll();
        }
      }
    });

    // Enhance object selection
    canvas.on('selection:created', () => {
      const activeObj = canvas.getActiveObject();
      if (activeObj && !activeObj.group) {
        const objects = canvas.getObjects();
        const currentIndex = objects.indexOf(activeObj);
        
        // Remove the object from its current position
        objects.splice(currentIndex, 1);
        // Add it back at the end (top)
        objects.push(activeObj);
        
        canvas.requestRenderAll();
      }
    });

    // Setup hover effect for selectable objects
    canvas.on('mouse:over', (options) => {
      if (options.target && options.target.selectable) {
        options.target.set({
          borderColor: '#2196F3',
          cornerColor: '#2196F3',
          transparentCorners: false,
          borderScaleFactor: 2, // Make borders more visible on hover
          borderDashArray: [3, 3] // Add dashed border on hover
        });
        canvas.requestRenderAll();
      }
    });

    canvas.on('mouse:out', (options) => {
      if (options.target && options.target.selectable) {
        options.target.set({
          borderColor: 'rgba(102,153,255,0.75)',
          cornerColor: 'rgba(102,153,255,0.75)',
          transparentCorners: true,
          borderScaleFactor: 1,
          borderDashArray: null
        });
        canvas.requestRenderAll();
      }
    });

    // Add keyboard shortcuts for bringing objects forward/backward
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!canvas.getActiveObject()) return;

      // Page Up brings object forward
      if (e.key === 'PageUp') {
        const obj = canvas.getActiveObject();
        const objects = canvas.getObjects();
        const currentIndex = objects.indexOf(obj);
        if (currentIndex < objects.length - 1) {
          objects.splice(currentIndex, 1);
          objects.splice(currentIndex + 1, 0, obj);
          canvas.requestRenderAll();
          e.preventDefault();
        }
      }
      // Page Down sends object backward
      else if (e.key === 'PageDown') {
        const obj = canvas.getActiveObject();
        const objects = canvas.getObjects();
        const currentIndex = objects.indexOf(obj);
        if (currentIndex > 0) {
          objects.splice(currentIndex, 1);
          objects.splice(currentIndex - 1, 0, obj);
          canvas.requestRenderAll();
          e.preventDefault();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Initialize drawing brush
    canvas.freeDrawingBrush = new PencilBrush(canvas);
    canvas.freeDrawingBrush.color = activeColor;
    canvas.freeDrawingBrush.width = strokeWidth;

    const handleResize = () => {
      canvas.setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
      canvas.requestRenderAll();
    };

    window.addEventListener('resize', handleResize);
    
    setFabricCanvas(canvas);
    toast.info(
      "Selection Tips:\n" +
      "• Hold Alt + Click to cycle through overlapping objects\n" +
      "• Hold Shift for multiple selection\n" +
      "• Use Page Up/Down to bring objects forward/backward",
      { duration: 5000 }
    );

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      canvas.dispose();
    };
  }, []);

  // Update color and stroke width
  useEffect(() => {
    if (!fabricCanvas) return;

    // Update active object color and stroke width if one is selected
    const activeObject = fabricCanvas.getActiveObject();
    if (activeObject) {
      if (activeObject.type === 'path') {
        // For freehand drawing paths, only update stroke properties
        activeObject.set({
          stroke: activeColor,
          strokeWidth: strokeWidth
        });
      } else if (activeObject.type === 'line' || activeObject.type === 'arrow') {
        // For lines and arrows, update stroke properties
        activeObject.set({
          stroke: activeColor,
          strokeWidth: strokeWidth
        });
      } else if (activeObject.type === 'textbox') {
        // For text, only update the fill color
        activeObject.set({
          fill: activeColor
        });
      } else {
        // For shapes like rectangles and circles
        const currentFill = activeObject.get('fill');
        if (currentFill) {
          // If the object already has a fill, preserve it
          activeObject.set({
            stroke: activeColor,
            strokeWidth: strokeWidth
          });
        } else {
          // If it's a stroke-only shape, update stroke properties
          activeObject.set({
            stroke: activeColor,
            strokeWidth: strokeWidth,
            fill: 'transparent'
          });
        }
      }
    }

    // Update drawing brush
    if (fabricCanvas.freeDrawingBrush) {
      fabricCanvas.freeDrawingBrush.color = activeColor;
      fabricCanvas.freeDrawingBrush.width = strokeWidth;
    }
    
    fabricCanvas.renderAll();
  }, [activeColor, strokeWidth]);

  useEffect(() => {
    if (!fabricCanvas) return;

    console.log("Setting drawing mode:", activeTool === "draw");
    
    fabricCanvas.isDrawingMode = activeTool === "draw";
    fabricCanvas.selection = activeTool === "select";
    
    if (activeTool === "draw") {
      if (!fabricCanvas.freeDrawingBrush) {
        fabricCanvas.freeDrawingBrush = new PencilBrush(fabricCanvas);
      }
      fabricCanvas.freeDrawingBrush.color = activeColor;
      fabricCanvas.freeDrawingBrush.width = strokeWidth;
      console.log("Drawing mode enabled, brush color:", activeColor, "width:", strokeWidth);
    }
    
    fabricCanvas.renderAll();
  }, [activeTool, activeColor, strokeWidth, fabricCanvas]);

  // Update the addShape function to create high-quality shapes
  const addShape = (shapeType: string) => {
    if (!fabricCanvas) return;

    const centerX = fabricCanvas.width! / 2;
    const centerY = fabricCanvas.height! / 2;

    const commonProps = {
      stroke: activeColor,
      strokeWidth: strokeWidth,
      fill: 'transparent',
      left: centerX - 50,
      top: centerY - 50,
      width: 100,
      height: 100,
      strokeUniform: true,
      noScaleCache: false,
      objectCaching: true,
    };

    switch (shapeType) {
      case "rectangle":
        const rect = new Rect({
          ...commonProps,
          rx: 0,
          ry: 0,
        });
        fabricCanvas.add(rect);
        break;
      case "circle":
        const circle = new Circle({
          ...commonProps,
          radius: 50,
        });
        fabricCanvas.add(circle);
        break;
      case "line":
        const line = new Line([50, 50, 150, 50], {
          stroke: activeColor,
          strokeWidth: strokeWidth,
          left: centerX - 50,
          top: centerY,
          strokeUniform: true,
          noScaleCache: false,
          objectCaching: true,
        });
        fabricCanvas.add(line);
        break;
      case "text":
        const text = new Textbox("Type here", {
          left: centerX - 50,
          top: centerY - 10,
          width: 100,
          fontSize: 16,
          fill: activeColor,
          strokeWidth: 0,
          fontFamily: 'Arial',
          objectCaching: true,
        });
        fabricCanvas.add(text);
        break;
    }

    fabricCanvas.renderAll();
  };

  const handleToolClick = (tool: Tool) => {
    console.log("Tool clicked:", tool);
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
      
      {/* Design Panel - Left Side */}
      <DesignPanel 
        canvas={fabricCanvas}
        activeColor={activeColor}
        onColorChange={setActiveColor}
      />
      
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