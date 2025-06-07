
import { useEffect, useRef, useState } from "react";
import * as fabric from "fabric";
import { Toolbar } from "./Toolbar";
import { ColorPicker } from "./ColorPicker";
import { AIAssistant } from "./AIAssistant";
import { ExportPanel } from "./ExportPanel";
import { toast } from "sonner";
import { ThemeToggle } from "./ThemeToggle";
import { useTheme } from "@/contexts/ThemeContext";

export type Tool = 
  | "select" 
  | "draw" 
  | "eraser" 
  | "rectangle" 
  | "circle" 
  | "line" 
  | "text" 
  | "arrow"
  | "triangle"
  | "ellipse"
  | "star"
  | "diamond"
  | "pentagon"
  | "hexagon";

export const Canvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const [fabricCanvas, setFabricCanvas] = useState<fabric.Canvas | null>(null);
  const [activeColor, setActiveColor] = useState("#1e40af");
  const [activeTool, setActiveTool] = useState<Tool>("select");
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [isErasing, setIsErasing] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [eraserPath, setEraserPath] = useState<{x: number, y: number}[]>([]);
  const { theme } = useTheme();

  // Shape drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [activeShape, setActiveShape] = useState<any>(null);

  // Get theme-appropriate color
  const getThemeColor = (color: string) => {
    if (color !== "#000000" && color !== "#ffffff" && color !== "#1e40af") {
      return color;
    }
    return theme === 'dark' ? '#ffffff' : '#000000';
  };

  // Initialize canvas only once with proper cleanup
  useEffect(() => {
    if (!canvasRef.current) return;

    // Dispose existing canvas if it exists
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.dispose();
      fabricCanvasRef.current = null;
    }

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
      isDrawingMode: false,
    });

    // Initialize the drawing brush
    canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
    canvas.freeDrawingBrush.color = getThemeColor(activeColor);
    canvas.freeDrawingBrush.width = strokeWidth;

    fabricCanvasRef.current = canvas;
    setFabricCanvas(canvas);
    console.log("Canvas initialized successfully");
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
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
      }
    };
  }, []); // Keep empty dependency array but add proper cleanup

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
  }, [activeColor, strokeWidth, theme, fabricCanvas]);

  // Function to create shapes based on tool type
  const createShape = (
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    shapeType: Tool
  ) => {
    if (!fabricCanvas) return null;
  
    const width = Math.abs(endX - startX);
    const height = Math.abs(endY - startY);
    const left = Math.min(startX, endX);
    const top = Math.min(startY, endY);
    const centerX = (startX + endX) / 2;
    const centerY = (startY + endY) / 2;
  
    let shape;
    const shapeOptions = {
      fill: 'transparent',
      stroke: getThemeColor(activeColor),
      strokeWidth,
      selectable: true,
      evented: true,
      hasControls: true,
      hasBorders: true,
    };
  
    switch (shapeType) {
      case 'rectangle':
        shape = new fabric.Rect({
          left,
          top,
          width,
          height,
          ...shapeOptions,
        });
        break;
  
      case 'circle':
        const radius = Math.max(width, height) / 2;
        shape = new fabric.Circle({
          left: centerX - radius,
          top: centerY - radius,
          radius,
          ...shapeOptions,
        });
        break;
  
      case 'line':
        shape = new fabric.Line([startX, startY, endX, endY], {
          stroke: getThemeColor(activeColor),
          strokeWidth,
          selectable: true,
          evented: true,
          hasControls: true,
          hasBorders: true,
        });
        break;
  
      case 'triangle':
        shape = new fabric.Triangle({
          left,
          top,
          width,
          height,
          ...shapeOptions,
        });
        break;
  
      case 'star':
        const starPoints = createStarPoints(
          0, 0, // relative to shape origin
          5, // 5-pointed star
          Math.max(width, height) / 2,
          Math.max(width, height) / 4
        );
        shape = new fabric.Polygon(starPoints, {
          ...shapeOptions,
          left: centerX - Math.max(width, height) / 2,
          top: centerY - Math.max(width, height) / 2,
        });
        break;
  
      case 'pentagon':
        const pentagonPoints = createRegularPolygon(
          0, 0, // relative to shape origin
          5,
          Math.max(width, height) / 2
        );
        shape = new fabric.Polygon(pentagonPoints, {
          ...shapeOptions,
          left: centerX - Math.max(width, height) / 2,
          top: centerY - Math.max(width, height) / 2,
        });
        break;
  
      case 'hexagon':
        const hexagonPoints = createRegularPolygon(
          0, 0, // relative to shape origin
          6,
          Math.max(width, height) / 2
        );
        shape = new fabric.Polygon(hexagonPoints, {
          ...shapeOptions,
          left: centerX - Math.max(width, height) / 2,
          top: centerY - Math.max(width, height) / 2,
        });
        break;
  
      case 'diamond':
        const diamondPoints = createDiamondPoints(
          0, 0, // relative to shape origin
          width,
          height
        );
        shape = new fabric.Polygon(diamondPoints, {
          ...shapeOptions,
          left: centerX - width / 2,
          top: centerY - height / 2,
        });
        break;
    }
  
    if (shape) {
      fabricCanvas.add(shape);
      fabricCanvas.renderAll();
      console.log(`Created ${shapeType} shape:`, shape);
      return shape;
    }
    return null;
  };

  // Helper function to create a regular polygon
  const createRegularPolygon = (centerX: number, centerY: number, sides: number, radius: number) => {
    const points: { x: number; y: number }[] = [];
    const angleStep = (2 * Math.PI) / sides;
    
    for (let i = 0; i < sides; i++) {
      const angle = i * angleStep - Math.PI / 2; // Start from top
      points.push({
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      });
    }
    
    return points;
  };

  // Helper function to create a star shape
  const createStarPoints = (centerX: number, centerY: number, points: number, outerRadius: number, innerRadius: number) => {
    const starPoints: { x: number; y: number }[] = [];
    const angleStep = Math.PI / points;

    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = i * angleStep - Math.PI / 2; // Start from top
      starPoints.push({
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      });
    }

    return starPoints;
  };

  // Helper function to create a diamond shape
  const createDiamondPoints = (centerX: number, centerY: number, width: number, height: number) => {
    return [
      { x: centerX, y: centerY - height / 2 }, // top
      { x: centerX + width / 2, y: centerY }, // right
      { x: centerX, y: centerY + height / 2 }, // bottom
      { x: centerX - width / 2, y: centerY }, // left
    ];
  };

  // Check if current tool is a shape tool
  const isShapeTool = (tool: Tool): boolean => {
    return ['rectangle', 'circle', 'line', 'triangle', 'star', 'pentagon', 'hexagon', 'diamond'].includes(tool);
  };

  // Setup shape and text drawing handlers
  useEffect(() => {
    if (!fabricCanvas) return;

    const handleMouseDown = (e: any) => {
      const pointer = fabricCanvas.getPointer(e.e);
      
      // Handle text tool
      if (activeTool === 'text') {
        const textbox = new fabric.Textbox('Type here', {
          left: pointer.x,
          top: pointer.y,
          fontSize: 20,
          fill: getThemeColor(activeColor),
          width: 200,
          editingBorderColor: getThemeColor(activeColor),
          borderColor: getThemeColor(activeColor),
          cursorColor: getThemeColor(activeColor),
          selectable: true,
          evented: true,
        });
        fabricCanvas.add(textbox);
        fabricCanvas.setActiveObject(textbox);
        textbox.enterEditing();
        textbox.selectAll();
        fabricCanvas.renderAll();
        setActiveTool('select');
        return;
      }

      // Handle shape tools
      if (isShapeTool(activeTool)) {
        // Don't start drawing if clicking on an existing object
        if (e.target) return;
        
        setIsDrawing(true);
        setStartPoint(pointer);
        console.log(`Starting to draw ${activeTool} at:`, pointer);
        
        // Create initial shape with minimal size
        const shape = createShape(
          pointer.x,
          pointer.y,
          pointer.x + 1,
          pointer.y + 1,
          activeTool
        );
        setActiveShape(shape);
        return;
      }
    };

    const handleMouseMove = (e: any) => {
      if (!isDrawing || !startPoint || !activeShape || !isShapeTool(activeTool)) return;

      const pointer = fabricCanvas.getPointer(e.e);
      
      // Calculate dimensions
      const width = pointer.x - startPoint.x;
      const height = pointer.y - startPoint.y;
      const absWidth = Math.abs(width);
      const absHeight = Math.abs(height);
      const left = Math.min(pointer.x, startPoint.x);
      const top = Math.min(pointer.y, startPoint.y);
      const centerX = (pointer.x + startPoint.x) / 2;
      const centerY = (pointer.y + startPoint.y) / 2;

      // Update shape based on type
      switch (activeTool) {
        case 'rectangle':
          activeShape.set({
            left,
            top,
            width: absWidth,
            height: absHeight,
          });
          break;
        case 'circle': {
          const radius = Math.sqrt(
            Math.pow(pointer.x - startPoint.x, 2) +
            Math.pow(pointer.y - startPoint.y, 2)
          ) / 2;
          activeShape.set({
            left: centerX - radius,
            top: centerY - radius,
            radius: radius,
          });
          break;
        }
        case 'line':
          activeShape.set({
            x1: startPoint.x,
            y1: startPoint.y,
            x2: pointer.x,
            y2: pointer.y,
          });
          break;
        case 'triangle':
          activeShape.set({
            left,
            top,
            width: absWidth,
            height: absHeight,
          });
          break;
        case 'star': {
          const starPoints = createStarPoints(
            0, 0, // relative to shape origin
            5,
            Math.max(absWidth, absHeight) / 2,
            Math.max(absWidth, absHeight) / 4
          );
          activeShape.set({ 
            points: starPoints,
            left: centerX - Math.max(absWidth, absHeight) / 2,
            top: centerY - Math.max(absWidth, absHeight) / 2,
          });
          break;
        }
        case 'pentagon': {
          const pentagonPoints = createRegularPolygon(
            0, 0, // relative to shape origin
            5,
            Math.max(absWidth, absHeight) / 2
          );
          activeShape.set({ 
            points: pentagonPoints,
            left: centerX - Math.max(absWidth, absHeight) / 2,
            top: centerY - Math.max(absWidth, absHeight) / 2,
          });
          break;
        }
        case 'hexagon': {
          const hexagonPoints = createRegularPolygon(
            0, 0, // relative to shape origin
            6,
            Math.max(absWidth, absHeight) / 2
          );
          activeShape.set({ 
            points: hexagonPoints,
            left: centerX - Math.max(absWidth, absHeight) / 2,
            top: centerY - Math.max(absWidth, absHeight) / 2,
          });
          break;
        }
        case 'diamond': {
          const diamondPoints = createDiamondPoints(
            0, 0, // relative to shape origin
            absWidth,
            absHeight
          );
          activeShape.set({ 
            points: diamondPoints,
            left: centerX - absWidth / 2,
            top: centerY - absHeight / 2,
          });
          break;
        }
      }

      fabricCanvas.renderAll();
    };

    const handleMouseUp = () => {
      if (!isDrawing || !isShapeTool(activeTool)) return;
      
      setIsDrawing(false);
      setStartPoint(null);
      
      if (activeShape) {
        // Ensure the shape has minimum dimensions
        const bounds = activeShape.getBoundingRect();
        if (bounds.width < 5 && bounds.height < 5) {
          fabricCanvas.remove(activeShape);
          console.log("Removed shape - too small");
        } else {
          // Make sure the shape is properly configured
          activeShape.set({
            selectable: true,
            evented: true,
            hasControls: true,
            hasBorders: true,
          });
          fabricCanvas.setActiveObject(activeShape);
          console.log(`Completed ${activeTool} shape:`, activeShape);
          toast(`${activeTool} created!`);
        }
      }
      
      setActiveShape(null);
      fabricCanvas.renderAll();
      
      // Switch to select tool after creating a shape
      setActiveTool('select');
    };

    fabricCanvas.on('mouse:down', handleMouseDown);
    fabricCanvas.on('mouse:move', handleMouseMove);
    fabricCanvas.on('mouse:up', handleMouseUp);

    return () => {
      fabricCanvas.off('mouse:down', handleMouseDown);
      fabricCanvas.off('mouse:move', handleMouseMove);
      fabricCanvas.off('mouse:up', handleMouseUp);
    };
  }, [fabricCanvas, activeTool, isDrawing, startPoint, activeShape, activeColor, strokeWidth]);

  // Update tool setup
  useEffect(() => {
    if (!fabricCanvas) return;

    console.log("Setting up tool:", activeTool);
    
    // Reset canvas modes
    fabricCanvas.isDrawingMode = activeTool === "draw";
    fabricCanvas.selection = activeTool === "select";
    fabricCanvas.defaultCursor = activeTool === "eraser" ? 'crosshair' : 
                                activeTool === "select" ? 'default' : 'crosshair';
    fabricCanvas.skipTargetFind = activeTool !== "select" && activeTool !== "eraser";
    
    // Enable object interaction for select tool
    fabricCanvas.getObjects().forEach(obj => {
      obj.set({
        selectable: activeTool === 'select',
        evented: activeTool === 'select' || activeTool === 'eraser',
        hasControls: activeTool === 'select',
        hasBorders: activeTool === 'select',
      });
    });
    
    if (activeTool === "draw") {
      if (!fabricCanvas.freeDrawingBrush || !(fabricCanvas.freeDrawingBrush instanceof fabric.PencilBrush)) {
        fabricCanvas.freeDrawingBrush = new fabric.PencilBrush(fabricCanvas);
      }
      fabricCanvas.freeDrawingBrush.color = getThemeColor(activeColor);
      fabricCanvas.freeDrawingBrush.width = strokeWidth;
    }
    
    fabricCanvas.renderAll();
  }, [activeTool, fabricCanvas, strokeWidth, activeColor]);

  // Handle tool selection
  const handleToolClick = (tool: Tool) => {
    console.log("Tool clicked:", tool);
    setActiveTool(tool);
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
    const objects = fabricCanvas?.getObjects();
    if (objects && objects.length > 0) {
      fabricCanvas?.remove(objects[objects.length - 1]);
      fabricCanvas?.renderAll();
      toast("Undone!");
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
