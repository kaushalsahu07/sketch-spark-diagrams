import { useEffect, useRef, useState } from "react";
import * as fabric from "fabric";
import { Toolbar } from "./Toolbar";
import { ColorPicker } from "./ColorPicker";
import { AIAssistant } from "./AIAssistant";
import { ExportPanel } from "./ExportPanel";

export type Tool = 
  | "select" 
  | "draw" 
  | "rectangle" 
  | "circle" 
  | "line" 
  | "text" 
  | "eraser"
  | "triangle"
  | "diamond" 
  | "pentagon"
  | "hexagon"
  | "star";

interface CanvasProps {
  color: string;
  strokeWidth: number;
}

export const Canvas = ({ color, strokeWidth }: CanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const [activeTool, setActiveTool] = useState<Tool>("select");
  const [isDrawing, setIsDrawing] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [currentPath, setCurrentPath] = useState<fabric.Path | null>(null);
  const [, setThemeColor] = useState("#1e40af");
  const [, setStrokeWidth] = useState(2);

  // Update internal state when props change
  useEffect(() => {
    setThemeColor(color);
    setStrokeWidth(strokeWidth);
  }, [color, strokeWidth]);

  const initializeCanvas = () => {
    if (!canvasRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: 'transparent',
      selection: activeTool === "select",
    });

    fabricCanvasRef.current = canvas;

    const handleResize = () => {
      canvas.setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
      canvas.renderAll();
    };

    window.addEventListener('resize', handleResize);

    // Mouse down handler
    canvas.on('mouse:down', (e) => {
      if (activeTool === "select") return;
      
      const pointer = canvas.getPointer(e.e);
      setIsDrawing(true);

      if (activeTool === "draw") {
        canvas.isDrawingMode = true;
        canvas.freeDrawingBrush.color = color;
        canvas.freeDrawingBrush.width = strokeWidth;
      } else if (activeTool === "eraser") {
        canvas.isDrawingMode = true;
        canvas.freeDrawingBrush = new fabric.EraserBrush(canvas);
        canvas.freeDrawingBrush.width = strokeWidth * 2;
      } else if (activeTool === "text") {
        const text = new fabric.Textbox('Double click to edit', {
          left: pointer.x,
          top: pointer.y,
          fontSize: 16,
          fill: color,
          fontFamily: 'Arial',
          width: 200,
        });
        canvas.add(text);
        canvas.setActiveObject(text);
        text.enterEditing();
      } else {
        // Handle shape creation
        createShape(activeTool, pointer, color, strokeWidth, canvas);
      }
    });

    // Mouse move handler
    canvas.on('mouse:move', (e) => {
      if (!isDrawing || activeTool === "draw" || activeTool === "eraser" || activeTool === "text") return;
      
      const pointer = canvas.getPointer(e.e);
      updateShapeSize(activeTool, pointer, canvas);
    });

    // Mouse up handler
    canvas.on('mouse:up', () => {
      setIsDrawing(false);
      canvas.isDrawingMode = false;
      
      if (activeTool !== "select") {
        finalizeShape(canvas);
      }
    });

    // Path created handler for freehand drawing
    canvas.on('path:created', (e) => {
      const path = e.path;
      if (path) {
        path.set({
          stroke: color,
          strokeWidth: strokeWidth,
          fill: 'transparent'
        });
        setCurrentPath(path);
        canvas.renderAll();
      }
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.dispose();
    };
  };

  const createShape = (tool: Tool, pointer: fabric.Point, shapeColor: string, shapeStrokeWidth: number, canvas: fabric.Canvas) => {
    let shape: fabric.Object | null = null;

    const commonProps = {
      left: pointer.x,
      top: pointer.y,
      fill: 'transparent',
      stroke: shapeColor,
      strokeWidth: shapeStrokeWidth,
      selectable: true,
    };

    switch (tool) {
      case "rectangle":
        shape = new fabric.Rect({
          ...commonProps,
          width: 1,
          height: 1,
        });
        break;
      case "circle":
        shape = new fabric.Circle({
          ...commonProps,
          radius: 1,
        });
        break;
      case "line":
        shape = new fabric.Line([pointer.x, pointer.y, pointer.x + 1, pointer.y + 1], {
          stroke: shapeColor,
          strokeWidth: shapeStrokeWidth,
          selectable: true,
        });
        break;
      case "triangle":
        shape = new fabric.Triangle({
          ...commonProps,
          width: 1,
          height: 1,
        });
        break;
      case "diamond":
        const diamondPoints = [
          { x: 0, y: -50 },
          { x: 50, y: 0 },
          { x: 0, y: 50 },
          { x: -50, y: 0 }
        ];
        shape = new fabric.Polygon(diamondPoints, {
          ...commonProps,
          scaleX: 0.02,
          scaleY: 0.02,
        });
        break;
      case "pentagon":
        const pentagonPoints = [];
        for (let i = 0; i < 5; i++) {
          const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
          pentagonPoints.push({
            x: 50 * Math.cos(angle),
            y: 50 * Math.sin(angle)
          });
        }
        shape = new fabric.Polygon(pentagonPoints, {
          ...commonProps,
          scaleX: 0.02,
          scaleY: 0.02,
        });
        break;
      case "hexagon":
        const hexagonPoints = [];
        for (let i = 0; i < 6; i++) {
          const angle = (i * 2 * Math.PI) / 6;
          hexagonPoints.push({
            x: 50 * Math.cos(angle),
            y: 50 * Math.sin(angle)
          });
        }
        shape = new fabric.Polygon(hexagonPoints, {
          ...commonProps,
          scaleX: 0.02,
          scaleY: 0.02,
        });
        break;
      case "star":
        const starPoints = [];
        for (let i = 0; i < 10; i++) {
          const angle = (i * Math.PI) / 5;
          const radius = i % 2 === 0 ? 50 : 25;
          starPoints.push({
            x: radius * Math.cos(angle - Math.PI / 2),
            y: radius * Math.sin(angle - Math.PI / 2)
          });
        }
        shape = new fabric.Polygon(starPoints, {
          ...commonProps,
          scaleX: 0.02,
          scaleY: 0.02,
        });
        break;
    }

    if (shape) {
      canvas.add(shape);
      canvas.setActiveObject(shape);
      canvas.renderAll();
    }
  };

  const updateShapeSize = (tool: Tool, pointer: fabric.Point, canvas: fabric.Canvas) => {
    const activeObject = canvas.getActiveObject();
    if (!activeObject) return;

    const startX = activeObject.left || 0;
    const startY = activeObject.top || 0;
    const width = Math.abs(pointer.x - startX);
    const height = Math.abs(pointer.y - startY);

    switch (tool) {
      case "rectangle":
        (activeObject as fabric.Rect).set({
          width: width,
          height: height,
        });
        break;
      case "circle":
        const radius = Math.min(width, height) / 2;
        (activeObject as fabric.Circle).set({
          radius: radius,
        });
        break;
      case "line":
        (activeObject as fabric.Line).set({
          x2: pointer.x,
          y2: pointer.y,
        });
        break;
      case "triangle":
        (activeObject as fabric.Triangle).set({
          width: width,
          height: height,
        });
        break;
      case "diamond":
      case "pentagon":
      case "hexagon":
      case "star":
        const scale = Math.min(width, height) / 100;
        (activeObject as fabric.Polygon).set({
          scaleX: scale,
          scaleY: scale,
        });
        break;
    }

    canvas.renderAll();
  };

  const finalizeShape = (canvas: fabric.Canvas) => {
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
      activeObject.setCoords();
      canvas.renderAll();
    }
  };

  const handleToolClick = (tool: Tool) => {
    const fabricCanvas = fabricCanvasRef.current;
    if (!fabricCanvas) return;

    setActiveTool(tool);
    
    if (tool === "select") {
      fabricCanvas.isDrawingMode = false;
      fabricCanvas.selection = true;
      fabricCanvas.defaultCursor = 'default';
    } else {
      fabricCanvas.selection = false;
      fabricCanvas.defaultCursor = 'crosshair';
    }
    
    fabricCanvas.discardActiveObject();
    fabricCanvas.renderAll();
  };

  const handleColorChange = (newColor: string) => {
    const fabricCanvas = fabricCanvasRef.current;
    if (!fabricCanvas) return;
    
    const activeObject = fabricCanvas.getActiveObject();
    
    if (activeObject) {
      if (activeObject.type === 'path') {
        // For drawn paths, change stroke color
        activeObject.set({ stroke: newColor });
      } else if (activeObject.type === 'textbox' || activeObject.type === 'text') {
        // For text objects, change fill color
        activeObject.set({ fill: newColor });
      } else {
        // For shapes (rectangle, circle, etc.), only change stroke if fill is transparent
        // This preserves the original fill state of the object
        const currentFill = activeObject.fill;
        if (currentFill === 'transparent' || currentFill === '' || !currentFill) {
          // Keep transparent fill, only change stroke
          activeObject.set({ stroke: newColor });
        } else {
          // Object was intentionally filled, change both fill and stroke
          activeObject.set({ 
            fill: newColor,
            stroke: newColor 
          });
        }
      }
      fabricCanvas.renderAll();
    }
  };

  const handleStrokeWidthChange = (newStrokeWidth: number) => {
    const fabricCanvas = fabricCanvasRef.current;
    if (!fabricCanvas) return;
    
    const activeObject = fabricCanvas.getActiveObject();
    
    if (activeObject) {
      if (activeObject.type === 'path') {
        activeObject.set({ strokeWidth: newStrokeWidth });
      } else if (activeObject.type !== 'textbox' && activeObject.type !== 'text') {
        activeObject.set({ strokeWidth: newStrokeWidth });
      }
      fabricCanvas.renderAll();
    }
  };

  const handleClear = () => {
    const fabricCanvas = fabricCanvasRef.current;
    if (fabricCanvas) {
      fabricCanvas.clear();
      fabricCanvas.backgroundColor = 'transparent';
      fabricCanvas.renderAll();
    }
  };

  const handleUndo = () => {
    const fabricCanvas = fabricCanvasRef.current;
    if (fabricCanvas) {
      const objects = fabricCanvas.getObjects();
      if (objects.length > 0) {
        fabricCanvas.remove(objects[objects.length - 1]);
        fabricCanvas.renderAll();
      }
    }
  };

  const handleZoom = (direction: 'in' | 'out') => {
    const fabricCanvas = fabricCanvasRef.current;
    if (!fabricCanvas) return;

    const zoom = fabricCanvas.getZoom();
    const factor = direction === 'in' ? 1.1 : 0.9;
    const newZoom = zoom * factor;

    if (newZoom >= 0.1 && newZoom <= 5) {
      const center = fabricCanvas.getCenter();
      fabricCanvas.zoomToPoint(new fabric.Point(center.left, center.top), newZoom);
    }
  };

  useEffect(() => {
    const cleanup = initializeCanvas();
    return cleanup;
  }, [activeTool]);

  // Update brush colors and stroke width when props change
  useEffect(() => {
    const fabricCanvas = fabricCanvasRef.current;
    if (fabricCanvas) {
      if (fabricCanvas.freeDrawingBrush) {
        fabricCanvas.freeDrawingBrush.color = color;
        fabricCanvas.freeDrawingBrush.width = strokeWidth;
      }
    }
  }, [color, strokeWidth]);

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0" />
      
      <Toolbar
        activeTool={activeTool}
        onToolClick={handleToolClick}
        onClear={handleClear}
        onUndo={handleUndo}
        onZoom={handleZoom}
        onShowAI={() => setShowAI(true)}
        onShowExport={() => setShowExport(true)}
      />
      
      <ColorPicker
        color={color}
        onChange={handleColorChange}
        strokeWidth={strokeWidth}
        onStrokeWidthChange={handleStrokeWidthChange}
      />

      {showAI && (
        <AIAssistant 
          onClose={() => setShowAI(false)}
          canvas={fabricCanvasRef.current}
        />
      )}

      {showExport && (
        <ExportPanel 
          onClose={() => setShowExport(false)}
          canvas={fabricCanvasRef.current}
        />
      )}
    </div>
  );
};
