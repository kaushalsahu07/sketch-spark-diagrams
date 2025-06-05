import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas, Circle, Rect, Line, Textbox, Path, PencilBrush, Group } from "fabric";
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
  const [isErasing, setIsErasing] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [eraserPath, setEraserPath] = useState<{x: number, y: number}[]>([]);
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

    console.log("Setting up tool:", activeTool);
    
    // Reset canvas modes
    fabricCanvas.isDrawingMode = activeTool === "draw";
    fabricCanvas.selection = activeTool === "select";
    fabricCanvas.defaultCursor = activeTool === "eraser" ? 'crosshair' : 'default';
    
    if (activeTool === "draw") {
      if (!fabricCanvas.freeDrawingBrush || !(fabricCanvas.freeDrawingBrush instanceof PencilBrush)) {
        fabricCanvas.freeDrawingBrush = new PencilBrush(fabricCanvas);
      }
      fabricCanvas.freeDrawingBrush.color = getThemeColor(activeColor);
      fabricCanvas.freeDrawingBrush.width = strokeWidth;
      console.log("Drawing mode enabled, brush color:", getThemeColor(activeColor), "width:", strokeWidth);
    } else if (activeTool === "eraser") {
      // Set up eraser mode
      fabricCanvas.defaultCursor = 'crosshair';
      toast("Reality Eraser activated! Click and drag to erase objects!");
      
    // Add mouse events for eraser
      const handleMouseDown = (e: any) => {
        if (activeTool !== "eraser") return;
        setIsErasing(true);
        const point = fabricCanvas.getPointer(e.e);
        setEraserPath([point]);
      };

    const handleMouseMove = (e: any) => {
      if (activeTool !== "eraser" || !isErasing) return;
      
      const point = fabricCanvas.getPointer(e.e);
      setEraserPath(prev => {
        const newPath = [...prev, point];
        
        // Apply erasing effect
        if (newPath.length >= 2) {
          const prevPoint = newPath[newPath.length - 2];
          applyEraserEffect(prevPoint, point);
        }
        
        return newPath;
      });
    };

    const handleMouseUp = () => {
      if (activeTool !== "eraser") return;
      setIsErasing(false);
      setEraserPath([]);
      console.log("Eraser finished");
    };

    fabricCanvas.on('mouse:down', handleMouseDown);
    fabricCanvas.on('mouse:move', handleMouseMove);
    fabricCanvas.on('mouse:up', handleMouseUp);

    // Return cleanup function
    return () => {
      fabricCanvas.off('mouse:down', handleMouseDown);
      fabricCanvas.off('mouse:move', handleMouseMove);
      fabricCanvas.off('mouse:up', handleMouseUp);
    };
  }
  }, [activeTool, fabricCanvas]);
  const applyEraserEffect = (prevPoint: {x: number, y: number}, currentPoint: {x: number, y: number}) => {
    if (!fabricCanvas) return;
    
    const eraserRadius = strokeWidth * 4;
    const objects = fabricCanvas.getObjects().slice();
    
    objects.forEach(obj => {
      if (isPointNearObject(obj, currentPoint, eraserRadius)) {
        eraseFromObject(obj, prevPoint, currentPoint, eraserRadius);
      }
    });
    
    fabricCanvas.renderAll();
  };

  const isPointNearObject = (obj: any, point: {x: number, y: number}, radius: number): boolean => {
    const bounds = obj.getBoundingRect();
    
    // Check if point is within object bounds plus eraser radius
    return (
      point.x >= bounds.left - radius &&
      point.x <= bounds.left + bounds.width + radius &&
      point.y >= bounds.top - radius &&
      point.y <= bounds.top + bounds.height + radius
    );
  };

  const eraseFromObject = (obj: any, prevPoint: {x: number, y: number}, currentPoint: {x: number, y: number}, radius: number) => {
    if (!fabricCanvas) return;

    // For paths (drawings), apply a mask to hide the erased area
    if (obj.type === 'path') {
      applyEraserMask(obj, currentPoint, radius);
    } 
    // For lines, check if we should split them
    else if (obj.type === 'line') {
      eraseLine(obj, prevPoint, currentPoint, radius);
    }
    // For other shapes, reduce opacity or apply clipping
    else {
      const currentOpacity = obj.opacity || 1;
      const newOpacity = Math.max(0, currentOpacity - 0.1);
      
      if (newOpacity <= 0.1) {
        fabricCanvas.remove(obj);
      } else {
        obj.set('opacity', newOpacity);
      }
    }
  };

  const applyEraserMask = (pathObj: any, eraserPoint: {x: number, y: number}, radius: number) => {
    if (!fabricCanvas) return;
    
    // Create a simple approach: reduce opacity in areas near the eraser
    const bounds = pathObj.getBoundingRect();
    const relativeX = (eraserPoint.x - bounds.left) / bounds.width;
    const relativeY = (eraserPoint.y - bounds.top) / bounds.height;
    
    // If eraser is over the path, reduce its opacity
    if (relativeX >= 0 && relativeX <= 1 && relativeY >= 0 && relativeY <= 1) {
      const currentOpacity = pathObj.opacity || 1;
      const newOpacity = Math.max(0, currentOpacity - 0.05);
      
      if (newOpacity <= 0.1) {
        fabricCanvas.remove(pathObj);
      } else {
        pathObj.set('opacity', newOpacity);
      }
    }
  };

  const eraseLine = (lineObj: any, prevPoint: {x: number, y: number}, currentPoint: {x: number, y: number}, radius: number) => {
    if (!fabricCanvas) return;
    
    // Get line coordinates in canvas space
    const x1 = lineObj.x1 + lineObj.left;
    const y1 = lineObj.y1 + lineObj.top;
    const x2 = lineObj.x2 + lineObj.left;
    const y2 = lineObj.y2 + lineObj.top;
    
    // Check if eraser intersects with the line
    const distance = distancePointToLine({x: currentPoint.x, y: currentPoint.y}, {x: x1, y: y1}, {x: x2, y: y2});
    
    if (distance <= radius) {
      // Find the intersection point
      const t = findProjectionParameter({x: currentPoint.x, y: currentPoint.y}, {x: x1, y: y1}, {x: x2, y: y2});
      
      if (t > 0.1 && t < 0.9) { // Don't split if too close to endpoints
        // Split the line into two parts
        const intersectionX = x1 + t * (x2 - x1);
        const intersectionY = y1 + t * (y2 - y1);
        
        fabricCanvas.remove(lineObj);
        
        // Create first segment
        if (Math.sqrt(Math.pow(intersectionX - x1, 2) + Math.pow(intersectionY - y1, 2)) > 10) {
          const line1 = new Line([x1 - lineObj.left, y1 - lineObj.top, intersectionX - lineObj.left, intersectionY - lineObj.top], {
            stroke: lineObj.stroke,
            strokeWidth: lineObj.strokeWidth,
            left: lineObj.left,
            top: lineObj.top
          });
          fabricCanvas.add(line1);
        }
        
        // Create second segment
        if (Math.sqrt(Math.pow(x2 - intersectionX, 2) + Math.pow(y2 - intersectionY, 2)) > 10) {
          const line2 = new Line([intersectionX - lineObj.left, intersectionY - lineObj.top, x2 - lineObj.left, y2 - lineObj.top], {
            stroke: lineObj.stroke,
            strokeWidth: lineObj.strokeWidth,
            left: lineObj.left,
            top: lineObj.top
          });
          fabricCanvas.add(line2);
        }
      } else {
        // Just reduce opacity for end segments
        const currentOpacity = lineObj.opacity || 1;
        const newOpacity = Math.max(0, currentOpacity - 0.1);
        
        if (newOpacity <= 0.1) {
          fabricCanvas.remove(lineObj);
        } else {
          lineObj.set('opacity', newOpacity);
        }
      }
    }
  };

  const distancePointToLine = (point: {x: number, y: number}, lineStart: {x: number, y: number}, lineEnd: {x: number, y: number}): number => {
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    
    if (lenSq === 0) return Math.sqrt(A * A + B * B);
    
    const param = Math.max(0, Math.min(1, dot / lenSq));
    
    const xx = lineStart.x + param * C;
    const yy = lineStart.y + param * D;

    const dx = point.x - xx;
    const dy = point.y - yy;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const findProjectionParameter = (point: {x: number, y: number}, lineStart: {x: number, y: number}, lineEnd: {x: number, y: number}): number => {
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    
    if (lenSq === 0) return 0;
    
    return dot / lenSq;
  };

  // Function to set selection properties for new objects
  const setObjectSelectionProperties = (obj: any) => {
    obj.set({
      selectable: activeTool === 'select',
      evented: activeTool === 'select',
      hasControls: activeTool === 'select',
      hasBorders: activeTool === 'select',
      lockMovementX: activeTool !== 'select',
      lockMovementY: activeTool !== 'select'
    });
  };

  // Update object selection based on active tool
  useEffect(() => {
    if (!fabricCanvas) return;

    // Make all objects selectable and movable only when using select tool
    fabricCanvas.getObjects().forEach(obj => {
      obj.set({
        selectable: activeTool === 'select',
        evented: activeTool === 'select', // This controls if the object responds to events
      });
    });

    // Update canvas selection properties
    fabricCanvas.selection = activeTool === 'select'; // Enable/disable group selection
    fabricCanvas.skipTargetFind = activeTool !== 'select'; // Disable object targeting when not in select mode

    // Clear any active selections when switching tools
    if (activeTool !== 'select') {
      fabricCanvas.discardActiveObject();
    }

    // Update drawing mode
    fabricCanvas.isDrawingMode = activeTool === 'draw';

    fabricCanvas.renderAll();
  }, [activeTool, fabricCanvas]);

  // Add selection control to newly added objects
  const updateObjectSelection = (obj: any) => {
    obj.set({
      selectable: activeTool === 'select',
      evented: activeTool === 'select',
    });
  };

  // Handle shape addition
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
        updateObjectSelection(rect);
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
        updateObjectSelection(circle);
        break;
      
      case "line":
        const line = new Line([centerX - 50, centerY, centerX + 50, centerY], {
          stroke: themeColor,
          strokeWidth: strokeWidth,
        });
        fabricCanvas.add(line);
        updateObjectSelection(line);
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
        updateObjectSelection(text);
        break;
    }
    
    fabricCanvas.renderAll();
    setActiveTool("select");
  };

  // Handle tool selection
  const handleToolClick = (tool: Tool) => {
    console.log("Tool clicked:", tool);
    setActiveTool(tool);

    if (["rectangle", "circle", "line", "text"].includes(tool)) {
      addShape(tool);
    }
  };

  // Handle canvas clear
  const handleClear = () => {
    if (!fabricCanvas) return;
    fabricCanvas.clear();
    const canvasBackgroundColor = theme === 'dark' ? '#111827' : '#ffffff';
    fabricCanvas.backgroundColor = canvasBackgroundColor;
    fabricCanvas.renderAll();
    toast("Canvas cleared!");
  };

  // Handle undo
  const handleUndo = () => {
    // Basic undo functionality - in a real app you'd implement a proper history system
    const objects = fabricCanvas?.getObjects();
    if (objects && objects.length > 0) {
      fabricCanvas?.remove(objects[objects.length - 1]);
      fabricCanvas?.renderAll();
    }
  };

  // Handle zoom
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
