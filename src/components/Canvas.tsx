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
      setupEraserTool();
      toast("Precision Eraser activated! Drag to cut through objects!");
    }
    
    fabricCanvas.renderAll();
  }, [activeTool, activeColor, strokeWidth, fabricCanvas, theme]);

  const setupEraserTool = () => {
    if (!fabricCanvas) return;

    const handleMouseDown = (e: any) => {
      if (activeTool !== "eraser") return;
      setIsErasing(true);
      setEraserPath([{ x: e.pointer.x, y: e.pointer.y }]);
    };

    const handleMouseMove = (e: any) => {
      if (activeTool !== "eraser" || !isErasing) return;
      
      const newPoint = { x: e.pointer.x, y: e.pointer.y };
      setEraserPath(prev => {
        const newPath = [...prev, newPoint];
        
        // Process erasing with the current path segment
        if (newPath.length >= 2) {
          const prevPoint = newPath[newPath.length - 2];
          processEraserSegment(prevPoint, newPoint);
        }
        
        return newPath;
      });
    };

    const handleMouseUp = () => {
      if (activeTool !== "eraser") return;
      setIsErasing(false);
      setEraserPath([]);
    };

    // Remove any existing listeners first
    fabricCanvas.off('mouse:down');
    fabricCanvas.off('mouse:move'); 
    fabricCanvas.off('mouse:up');

    // Add new listeners
    fabricCanvas.on('mouse:down', handleMouseDown);
    fabricCanvas.on('mouse:move', handleMouseMove);
    fabricCanvas.on('mouse:up', handleMouseUp);
  };

  const processEraserSegment = (startPoint: {x: number, y: number}, endPoint: {x: number, y: number}) => {
    if (!fabricCanvas) return;
    
    const eraserRadius = strokeWidth * 3; // Eraser size
    const objects = fabricCanvas.getObjects().slice(); // Create a copy to avoid mutation issues
    
    objects.forEach(obj => {
      if (objectIntersectsEraserPath(obj, startPoint, endPoint, eraserRadius)) {
        eraseFromObject(obj, startPoint, endPoint, eraserRadius);
      }
    });
    
    fabricCanvas.renderAll();
  };

  const objectIntersectsEraserPath = (obj: any, start: {x: number, y: number}, end: {x: number, y: number}, radius: number): boolean => {
    const objBounds = obj.getBoundingRect();
    
    // Expand bounds by eraser radius
    const expandedBounds = {
      left: objBounds.left - radius,
      top: objBounds.top - radius,
      right: objBounds.left + objBounds.width + radius,
      bottom: objBounds.top + objBounds.height + radius
    };

    // Check if eraser path intersects with object bounds
    return lineIntersectsRect(start, end, expandedBounds);
  };

  const lineIntersectsRect = (start: {x: number, y: number}, end: {x: number, y: number}, rect: {left: number, top: number, right: number, bottom: number}): boolean => {
    // Simple AABB line intersection
    const minX = Math.min(start.x, end.x);
    const maxX = Math.max(start.x, end.x);
    const minY = Math.min(start.y, end.y);
    const maxY = Math.max(start.y, end.y);

    return !(maxX < rect.left || minX > rect.right || maxY < rect.top || minY > rect.bottom);
  };

  const eraseFromObject = (obj: any, start: {x: number, y: number}, end: {x: number, y: number}, radius: number) => {
    if (!fabricCanvas) return;

    if (obj.type === 'path') {
      eraseFromPath(obj, start, end, radius);
    } else if (obj.type === 'line') {
      eraseFromLine(obj, start, end, radius);
    } else {
      // For other shapes, create a clipping effect by reducing opacity in intersected areas
      const intersection = calculateIntersection(obj, start, end, radius);
      if (intersection > 0.3) { // If significant intersection, remove the object
        fabricCanvas.remove(obj);
      } else if (intersection > 0) {
        // Partial intersection - reduce opacity
        obj.set('opacity', Math.max(0.1, (obj.opacity || 1) - intersection));
      }
    }
  };

  const eraseFromPath = (pathObj: any, start: {x: number, y: number}, end: {x: number, y: number}, radius: number) => {
    if (!fabricCanvas) return;
    
    try {
      // For paths (freehand drawings), we'll split them at intersection points
      const pathData = pathObj.path;
      if (!pathData || !Array.isArray(pathData)) return;

      const newPaths = splitPathAtEraserIntersection(pathData, start, end, radius, pathObj);
      
      if (newPaths.length > 0) {
        // Remove original path
        fabricCanvas.remove(pathObj);
        
        // Add new path segments
        newPaths.forEach(pathData => {
          if (pathData.length > 1) {
            const newPath = new Path(pathData, {
              stroke: pathObj.stroke,
              strokeWidth: pathObj.strokeWidth,
              fill: 'transparent',
              left: pathObj.left,
              top: pathObj.top
            });
            fabricCanvas.add(newPath);
          }
        });
      }
    } catch (error) {
      console.log("Error processing path:", error);
      // Fallback: just reduce opacity
      pathObj.set('opacity', Math.max(0, (pathObj.opacity || 1) - 0.3));
      if (pathObj.opacity <= 0.1) {
        fabricCanvas.remove(pathObj);
      }
    }
  };

  const splitPathAtEraserIntersection = (pathData: any[], start: {x: number, y: number}, end: {x: number, y: number}, radius: number, originalObj: any): string[] => {
    const segments: string[] = [];
    let currentSegment = '';
    let isFirstPoint = true;
    
    for (let i = 0; i < pathData.length; i++) {
      const command = pathData[i];
      if (!Array.isArray(command) || command.length < 3) continue;
      
      const [type, x, y] = command;
      const point = { x: x + (originalObj.left || 0), y: y + (originalObj.top || 0) };
      
      // Check if this point is within the eraser's influence
      const distanceToEraserLine = distancePointToLineSegment(point, start, end);
      const isErased = distanceToEraserLine <= radius;
      
      if (!isErased) {
        if (isFirstPoint) {
          currentSegment = `M ${x} ${y}`;
          isFirstPoint = false;
        } else {
          if (type === 'L') {
            currentSegment += ` L ${x} ${y}`;
          } else if (type === 'Q' && command.length >= 5) {
            currentSegment += ` Q ${command[1]} ${command[2]} ${x} ${y}`;
          } else if (type === 'C' && command.length >= 7) {
            currentSegment += ` C ${command[1]} ${command[2]} ${command[3]} ${command[4]} ${x} ${y}`;
          }
        }
      } else {
        // This point is erased, end current segment if it has content
        if (currentSegment && !isFirstPoint) {
          segments.push(currentSegment);
          currentSegment = '';
          isFirstPoint = true;
        }
      }
    }
    
    // Add final segment if it has content
    if (currentSegment && !isFirstPoint) {
      segments.push(currentSegment);
    }
    
    return segments;
  };

  const eraseFromLine = (lineObj: any, start: {x: number, y: number}, end: {x: number, y: number}, radius: number) => {
    if (!fabricCanvas) return;
    
    const lineStart = { x: lineObj.x1 + lineObj.left, y: lineObj.y1 + lineObj.top };
    const lineEnd = { x: lineObj.x2 + lineObj.left, y: lineObj.y2 + lineObj.top };
    
    // Find intersection points with the eraser path
    const intersections = findLineEraserIntersections(lineStart, lineEnd, start, end, radius);
    
    if (intersections.length > 0) {
      fabricCanvas.remove(lineObj);
      
      // Create new line segments for parts not erased
      const segments = createLineSegmentsFromIntersections(lineStart, lineEnd, intersections);
      
      segments.forEach(segment => {
        if (segment.length >= 2) {
          const newLine = new Line([
            segment[0].x - lineObj.left, segment[0].y - lineObj.top,
            segment[1].x - lineObj.left, segment[1].y - lineObj.top
          ], {
            stroke: lineObj.stroke,
            strokeWidth: lineObj.strokeWidth,
            left: lineObj.left,
            top: lineObj.top
          });
          fabricCanvas.add(newLine);
        }
      });
    }
  };

  const distancePointToLineSegment = (point: {x: number, y: number}, lineStart: {x: number, y: number}, lineEnd: {x: number, y: number}): number => {
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    
    if (lenSq === 0) return Math.sqrt(A * A + B * B);
    
    const param = dot / lenSq;
    
    let xx, yy;
    if (param < 0) {
      xx = lineStart.x;
      yy = lineStart.y;
    } else if (param > 1) {
      xx = lineEnd.x;
      yy = lineEnd.y;
    } else {
      xx = lineStart.x + param * C;
      yy = lineStart.y + param * D;
    }

    const dx = point.x - xx;
    const dy = point.y - yy;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const findLineEraserIntersections = (lineStart: {x: number, y: number}, lineEnd: {x: number, y: number}, eraserStart: {x: number, y: number}, eraserEnd: {x: number, y: number}, radius: number): {x: number, y: number}[] => {
    const intersections: {x: number, y: number}[] = [];
    
    // Sample points along the line and check if they're within eraser radius
    const samples = 20;
    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      const point = {
        x: lineStart.x + t * (lineEnd.x - lineStart.x),
        y: lineStart.y + t * (lineEnd.y - lineStart.y)
      };
      
      const distance = distancePointToLineSegment(point, eraserStart, eraserEnd);
      if (distance <= radius) {
        intersections.push(point);
      }
    }
    
    return intersections;
  };

  const createLineSegmentsFromIntersections = (lineStart: {x: number, y: number}, lineEnd: {x: number, y: number}, intersections: {x: number, y: number}[]): {x: number, y: number}[][] => {
    if (intersections.length === 0) {
      return [[lineStart, lineEnd]];
    }
    
    // For simplicity, if any part of the line intersects with eraser, split at first and last intersection
    const firstIntersection = intersections[0];
    const lastIntersection = intersections[intersections.length - 1];
    
    const segments: {x: number, y: number}[][] = [];
    
    // Segment before first intersection
    const distToFirst = Math.sqrt(
      Math.pow(firstIntersection.x - lineStart.x, 2) + 
      Math.pow(firstIntersection.y - lineStart.y, 2)
    );
    if (distToFirst > 5) { // Minimum segment length
      segments.push([lineStart, firstIntersection]);
    }
    
    // Segment after last intersection
    const distToLast = Math.sqrt(
      Math.pow(lineEnd.x - lastIntersection.x, 2) + 
      Math.pow(lineEnd.y - lastIntersection.y, 2)
    );
    if (distToLast > 5) { // Minimum segment length
      segments.push([lastIntersection, lineEnd]);
    }
    
    return segments;
  };

  const calculateIntersection = (obj: any, start: {x: number, y: number}, end: {x: number, y: number}, radius: number): number => {
    const bounds = obj.getBoundingRect();
    const eraserArea = Math.PI * radius * radius;
    const objArea = bounds.width * bounds.height;
    
    // Simple approximation - in a real implementation you'd do proper geometric intersection
    const overlapRatio = Math.min(1, eraserArea / objArea);
    return overlapRatio * 0.5; // Scale down the effect
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
