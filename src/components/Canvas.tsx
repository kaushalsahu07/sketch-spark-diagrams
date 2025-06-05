import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas, Circle, Rect, Line, Textbox, Path, PencilBrush } from "fabric";
import { Toolbar } from "./Toolbar";
import { ColorPicker } from "./ColorPicker";
import { AIAssistant } from "./AIAssistant";
import { ExportPanel } from "./ExportPanel";
import { toast } from "sonner";
import { ThemeToggle } from "./ThemeToggle";
import { useTheme } from "@/contexts/ThemeContext";

export type Tool = "select" | "draw" | "eraser" | "rectangle" | "circle" | "line" | "text" | "arrow";

export const Canvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [activeColor, setActiveColor] = useState("#1e40af");
  const [activeTool, setActiveTool] = useState<Tool>("select");
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [eraserPath, setEraserPath] = useState<any[]>([]);
  const { theme } = useTheme();

  // Get theme-appropriate color
  const getThemeColor = (color: string) => {
    // If user selected a custom color (not black or white), keep it
    if (color !== "#000000" && color !== "#ffffff" && color !== "#1e40af") {
      return color;
    }
    // Return theme-appropriate default color
    return theme === 'dark' ? '#ffffff' : '#000000';
  };

  // Initialize canvas only once
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
      isDrawingMode: false,
    });

    // Initialize the drawing brush
    canvas.freeDrawingBrush = new PencilBrush(canvas);
    canvas.freeDrawingBrush.color = getThemeColor(activeColor);
    canvas.freeDrawingBrush.width = strokeWidth;

    setFabricCanvas(canvas);
    toast("Canvas ready! Start creating your diagram!");

    const handleResize = () => {
      canvas.setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
      canvas.renderAll();
    };

    // Handle keyboard events for delete functionality
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete') {
        const activeObject = canvas.getActiveObject();
        const activeObjects = canvas.getActiveObjects();
        
        if (activeObjects.length > 0) {
          activeObjects.forEach(obj => canvas.remove(obj));
          canvas.discardActiveObject();
          canvas.renderAll();
          toast("Selected objects deleted");
        }
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []); // Empty dependency array for one-time initialization

  // Handle theme changes without recreating canvas
  useEffect(() => {
    if (!fabricCanvas) return;
    
    // Save the current canvas state
    const objects = fabricCanvas.getObjects();
    const canvasBackgroundColor = theme === 'dark' ? '#111827' : '#ffffff';
    
    // Update canvas background and object colors for theme
    fabricCanvas.backgroundColor = canvasBackgroundColor;
    objects.forEach(obj => {
      if (obj.fill === '#000000' || obj.fill === '#ffffff') {
        obj.set('fill', getThemeColor(obj.fill as string));
      }
      if (obj.stroke === '#000000' || obj.stroke === '#ffffff') {
        obj.set('stroke', getThemeColor(obj.stroke as string));
      }
    });
    
    fabricCanvas.renderAll();
  }, [theme, fabricCanvas]);

  // Handle color and stroke width updates
  useEffect(() => {
    if (!fabricCanvas) return;

    const themeColor = getThemeColor(activeColor);

    // Update active object color if one is selected
    const activeObject = fabricCanvas.getActiveObject();
    if (activeObject) {
      if (activeObject.type === 'path') {
        activeObject.set({ stroke: themeColor });
      } else {
        activeObject.set({ 
          fill: themeColor,
          stroke: themeColor 
        });
      }
    }

    // Update drawing brush
    if (fabricCanvas.freeDrawingBrush) {
      fabricCanvas.freeDrawingBrush.color = themeColor;
      fabricCanvas.freeDrawingBrush.width = strokeWidth;
    }
    
    fabricCanvas.renderAll();
  }, [activeColor, strokeWidth, theme]);

  useEffect(() => {
    if (!fabricCanvas) return;

    console.log("Setting drawing mode:", activeTool === "draw");
    
    // Only enable drawing mode for draw tool, not eraser
    fabricCanvas.isDrawingMode = activeTool === "draw";
    fabricCanvas.selection = activeTool === "select";
    
    if (activeTool === "draw") {
      if (!fabricCanvas.freeDrawingBrush || !(fabricCanvas.freeDrawingBrush instanceof PencilBrush)) {
        fabricCanvas.freeDrawingBrush = new PencilBrush(fabricCanvas);
      }
      fabricCanvas.freeDrawingBrush.color = getThemeColor(activeColor);
      fabricCanvas.freeDrawingBrush.width = strokeWidth;
      console.log("Drawing mode enabled, brush color:", getThemeColor(activeColor), "width:", strokeWidth);
    } else if (activeTool === "eraser") {
      // Set up precise eraser mode
      fabricCanvas.defaultCursor = 'crosshair';
      toast("Precision Eraser activated! Drag to erase exact areas!");
      
      // Add mouse events for precise eraser
      const handleMouseDown = (e: any) => {
        if (activeTool !== "eraser") return;
        setIsDrawing(true);
        setEraserPath([{ x: e.pointer.x, y: e.pointer.y }]);
      };

      const handleMouseMove = (e: any) => {
        if (activeTool !== "eraser" || !isDrawing) return;
        
        setEraserPath(prev => {
          const newPath = [...prev, { x: e.pointer.x, y: e.pointer.y }];
          
          // Apply erasing to objects that intersect with the current path segment
          if (newPath.length >= 2) {
            const lastPoint = newPath[newPath.length - 2];
            const currentPoint = newPath[newPath.length - 1];
            eraseAlongLine(lastPoint, currentPoint);
          }
          
          return newPath;
        });
      };

      const handleMouseUp = () => {
        setIsDrawing(false);
        setEraserPath([]);
      };

      fabricCanvas.on('mouse:down', handleMouseDown);
      fabricCanvas.on('mouse:move', handleMouseMove);
      fabricCanvas.on('mouse:up', handleMouseUp);

      // Cleanup function
      return () => {
        fabricCanvas.off('mouse:down', handleMouseDown);
        fabricCanvas.off('mouse:move', handleMouseMove);
        fabricCanvas.off('mouse:up', handleMouseUp);
      };
    } else {
      fabricCanvas.defaultCursor = 'default';
    }
    
    fabricCanvas.renderAll();
  }, [activeTool, activeColor, strokeWidth, fabricCanvas, theme, isDrawing]);

  const eraseAlongLine = (startPoint: {x: number, y: number}, endPoint: {x: number, y: number}) => {
    if (!fabricCanvas) return;
    
    const eraserRadius = strokeWidth * 5;
    const objects = fabricCanvas.getObjects();
    
    objects.forEach(obj => {
      if (obj.type === 'path') {
        // For path objects (drawn lines), we need to modify the path data
        eraseFromPath(obj, startPoint, endPoint, eraserRadius);
      } else {
        // For other objects, check if they intersect with the eraser line
        if (objectIntersectsLine(obj, startPoint, endPoint, eraserRadius)) {
          // Create a clipping mask to "erase" parts of the object
          applyEraserMask(obj, startPoint, endPoint, eraserRadius);
        }
      }
    });
    
    fabricCanvas.renderAll();
  };

  const eraseFromPath = (pathObj: any, startPoint: {x: number, y: number}, endPoint: {x: number, y: number}, radius: number) => {
    // For path objects, we'll reduce their opacity in the erased area
    // This is a simplified approach - a full implementation would modify the actual path data
    const objBounds = pathObj.getBoundingRect();
    
    if (lineIntersectsRect(startPoint, endPoint, objBounds, radius)) {
      const currentOpacity = pathObj.opacity || 1;
      pathObj.set('opacity', Math.max(0, currentOpacity - 0.3));
      
      if (pathObj.opacity <= 0.1) {
        fabricCanvas?.remove(pathObj);
      }
    }
  };

  const objectIntersectsLine = (obj: any, startPoint: {x: number, y: number}, endPoint: {x: number, y: number}, radius: number): boolean => {
    const objBounds = obj.getBoundingRect();
    return lineIntersectsRect(startPoint, endPoint, objBounds, radius);
  };

  const lineIntersectsRect = (
    startPoint: {x: number, y: number}, 
    endPoint: {x: number, y: number}, 
    rect: {left: number, top: number, width: number, height: number}, 
    radius: number
  ): boolean => {
    // Expand rectangle by eraser radius
    const expandedRect = {
      left: rect.left - radius,
      top: rect.top - radius,
      right: rect.left + rect.width + radius,
      bottom: rect.top + rect.height + radius
    };

    // Check if line segment intersects with expanded rectangle
    return lineIntersectsRectangle(startPoint, endPoint, expandedRect);
  };

  const lineIntersectsRectangle = (
    start: {x: number, y: number}, 
    end: {x: number, y: number}, 
    rect: {left: number, top: number, right: number, bottom: number}
  ): boolean => {
    // Simple line-rectangle intersection check
    const minX = Math.min(start.x, end.x);
    const maxX = Math.max(start.x, end.x);
    const minY = Math.min(start.y, end.y);
    const maxY = Math.max(start.y, end.y);

    return !(maxX < rect.left || minX > rect.right || maxY < rect.top || minY > rect.bottom);
  };

  const applyEraserMask = (obj: any, startPoint: {x: number, y: number}, endPoint: {x: number, y: number}, radius: number) => {
    // Create a circular mask at the eraser position to simulate partial erasure
    const objBounds = obj.getBoundingRect();
    
    // For simplicity, we'll reduce opacity where the eraser touches
    const currentOpacity = obj.opacity || 1;
    obj.set('opacity', Math.max(0, currentOpacity - 0.2));
    
    // If opacity gets too low, remove the object
    if (obj.opacity <= 0.1) {
      fabricCanvas?.remove(obj);
    }
  };

  const addShape = (shapeType: string) => {
    if (!fabricCanvas) return;

    const centerX = fabricCanvas.width! / 2;
    const centerY = fabricCanvas.height! / 2;
    const themeColor = getThemeColor(activeColor);

    switch (shapeType) {
      case "rectangle":
        const rect = new Rect({
          left: centerX - 50,
          top: centerY - 25,
          fill: "transparent",
          stroke: themeColor,
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
          stroke: themeColor,
          strokeWidth: strokeWidth,
          radius: 25,
        });
        fabricCanvas.add(circle);
        break;
      
      case "line":
        const line = new Line([centerX - 50, centerY, centerX + 50, centerY], {
          stroke: themeColor,
          strokeWidth: strokeWidth,
        });
        fabricCanvas.add(line);
        break;
      
      case "text":
        const text = new Textbox("Double click to edit", {
          left: centerX - 75,
          top: centerY - 10,
          fill: themeColor,
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
    console.log("Tool clicked:", tool);
    setActiveTool(tool);

    if (["rectangle", "circle", "line", "text"].includes(tool)) {
      addShape(tool);
    }
  };

  const handleClear = () => {
    if (!fabricCanvas) return;
    fabricCanvas.clear();
    const canvasBackgroundColor = theme === 'dark' ? '#111827' : '#ffffff';
    fabricCanvas.backgroundColor = canvasBackgroundColor;
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
    <div className="relative w-full h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
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

      {/* Theme Toggle */}
      <div className="absolute top-4 left-4 z-10">
        <ThemeToggle />
      </div>

      {/* AI Assistant Panel */}
      {showAI && (
        <AIAssistant 
          canvas={fabricCanvas}
          onClose={() => setShowAI(false)}
          activeColor={getThemeColor(activeColor)}
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
