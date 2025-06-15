import { useEffect, useRef, useState } from "react";
import * as fabric from "fabric";
import { Toolbar } from "./Toolbar";
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

// Add ICON_SHORTCUTS mapping for keyboard shortcuts
const ICON_SHORTCUTS: Record<string, string> = {
  select: '1',
  rectangle: 'r',
  diamond: 'd',
  circle: 'c',
  line: 'l',
  triangle: '3',
  pencil: '2',
  text: 't',
  eraser: '0',
  star: 's',
  pentagon: 'p',
  hexagon: 'h'
};

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

  // Get theme-appropriate color
  const getThemeColor = (color: string) => {
    if (color !== "#000000" && color !== "#ffffff" && color !== "#1e40af") {
      return color;
    }
    return theme === 'dark' ? '#ffffff' : '#000000';
  };

  // Initialize canvas
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

    // Immediately load saved canvas data
    const savedData = localStorage.getItem('canvasData');
    if (savedData) {
      canvas.loadFromJSON(savedData, () => {
        canvas.renderAll();
        console.log('Canvas data loaded automatically');
      });
    }

    // Setup automatic saving
    const saveToLocalStorage = () => {
      const jsonData = canvas.toJSON();
      localStorage.setItem('canvasData', JSON.stringify(jsonData));
      console.log('Canvas saved to storage');
    };

    canvas.on('object:modified', saveToLocalStorage);
    canvas.on('object:added', saveToLocalStorage);
    canvas.on('object:removed', saveToLocalStorage);

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

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.off('object:modified', saveToLocalStorage);
      canvas.off('object:added', saveToLocalStorage);
      canvas.off('object:removed', saveToLocalStorage);
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
      }
    };
  }, []);

  // Handle theme changes
  useEffect(() => {
    if (!fabricCanvas) return;
    
    const objects = fabricCanvas.getObjects();
    const canvasBackgroundColor = theme === 'dark' ? '#111827' : '#ffffff';
    
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

  // Handle color and stroke width updates for drawing brush only
  useEffect(() => {
    if (!fabricCanvas) return;

    const themeColor = getThemeColor(activeColor);

    // Update drawing brush
    if (fabricCanvas.freeDrawingBrush) {
      fabricCanvas.freeDrawingBrush.color = themeColor;
      fabricCanvas.freeDrawingBrush.width = strokeWidth;
    }
    
    fabricCanvas.renderAll();
  }, [activeColor, strokeWidth, theme, fabricCanvas]);

  // Apply color to selected object when color is explicitly changed
  const applyColorToSelected = () => {
    if (!fabricCanvas) return;

    const themeColor = getThemeColor(activeColor);
    const activeObject = fabricCanvas.getActiveObject();
    
    if (activeObject) {
      if (activeObject.type === 'path') {
        // For drawn paths, change stroke color
        activeObject.set({ stroke: themeColor });
      } else if (activeObject.type === 'textbox' || activeObject.type === 'text') {
        // For text objects, change fill color
        activeObject.set({ fill: themeColor });
      } else {
        // For shapes (rectangle, circle, etc.), only change stroke if fill is transparent
        // This preserves the original fill state of the object
        const currentFill = activeObject.fill;
        if (currentFill === 'transparent' || currentFill === '' || !currentFill) {
          // Keep transparent fill, only change stroke
          activeObject.set({ stroke: themeColor });
        } else {
          // Object was intentionally filled, change both fill and stroke
          activeObject.set({ 
            fill: themeColor,
            stroke: themeColor 
          });
        }
      }
      fabricCanvas.renderAll();
    }
  };

  // Helper function to create a regular polygon
  const createRegularPolygon = (centerX: number, centerY: number, sides: number, radius: number) => {
    const points: { x: number; y: number }[] = [];
    const angleStep = (2 * Math.PI) / sides;
    
    for (let i = 0; i < sides; i++) {
      const angle = i * angleStep - Math.PI / 2;
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
      const angle = i * angleStep - Math.PI / 2;
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
      console.log(`Mouse down at: x=${pointer.x}, y=${pointer.y}, tool=${activeTool}`);
      
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
        toast("Text added! Click to edit.");
        return;
      }

      // Handle shape tools
      if (isShapeTool(activeTool)) {
        // Don't start drawing if clicking on an existing object
        if (e.target) {
          console.log("Clicked on existing object, not creating shape");
          return;
        }
        
        setIsDrawing(true);
        setStartPoint(pointer);
        console.log(`Starting to draw ${activeTool}`);
        return;
      }
    };

    const handleMouseMove = (e: any) => {
      if (!isDrawing || !startPoint || !isShapeTool(activeTool)) return;

      const pointer = fabricCanvas.getPointer(e.e);
      
      // Remove any temporary shape
      const objects = fabricCanvas.getObjects();
      const tempShape = objects.find(obj => (obj as any).isTemporary);
      if (tempShape) {

        fabricCanvas.remove(tempShape);
      }

      // Calculate dimensions
      const width = Math.abs(pointer.x - startPoint.x);
      const height = Math.abs(pointer.y - startPoint.y);
      const left = Math.min(pointer.x, startPoint.x);
      const top = Math.min(pointer.y, startPoint.y);
      const centerX = (pointer.x + startPoint.x) / 2;
      const centerY = (pointer.y + startPoint.y) / 2;

      let shape;
      const shapeOptions = {
        fill: 'transparent',
        stroke: getThemeColor(activeColor),
        strokeWidth,
        selectable: false,
        evented: false,
        isTemporary: true,
      };

      // Create preview shape
      switch (activeTool) {
        case 'rectangle':
          shape = new fabric.Rect({
            left,
            top,
            width,
            height,
            ...shapeOptions,
          });
          break;
        case 'circle': {
          const radius = Math.sqrt(Math.pow(pointer.x - startPoint.x, 2) + Math.pow(pointer.y - startPoint.y, 2)) / 2;
          shape = new fabric.Circle({
            left: centerX - radius,
            top: centerY - radius,
            radius: radius,
            ...shapeOptions,
          });
          break;
        }
        case 'line':
          shape = new fabric.Line([startPoint.x, startPoint.y, pointer.x, pointer.y], {
            stroke: getThemeColor(activeColor),
            strokeWidth,
            selectable: false,
            evented: false,
            isTemporary: true,
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
        case 'star': {
          const radius = Math.max(width, height) / 2;
          const starPoints = createStarPoints(0, 0, 5, radius, radius / 2);
          shape = new fabric.Polygon(starPoints, {
            ...shapeOptions,
            left: centerX - radius,
            top: centerY - radius,
          });
          break;
        }
        case 'pentagon': {
          const radius = Math.max(width, height) / 2;
          const pentagonPoints = createRegularPolygon(0, 0, 5, radius);
          shape = new fabric.Polygon(pentagonPoints, {
            ...shapeOptions,
            left: centerX - radius,
            top: centerY - radius,
          });
          break;
        }
        case 'hexagon': {
          const radius = Math.max(width, height) / 2;
          const hexagonPoints = createRegularPolygon(0, 0, 6, radius);
          shape = new fabric.Polygon(hexagonPoints, {
            ...shapeOptions,
            left: centerX - radius,
            top: centerY - radius,
          });
          break;
        }
        case 'diamond': {
          const diamondPoints = createDiamondPoints(0, 0, width, height);
          shape = new fabric.Polygon(diamondPoints, {
            ...shapeOptions,
            left: centerX - width / 2,
            top: centerY - height / 2,
          });
          break;
        }
      }

      if (shape) {
        fabricCanvas.add(shape);
        fabricCanvas.renderAll();
      }
    };

    const handleMouseUp = (e: any) => {
      if (!isDrawing || !startPoint || !isShapeTool(activeTool)) return;
      
      const pointer = fabricCanvas.getPointer(e.e);
      console.log(`Mouse up at: x=${pointer.x}, y=${pointer.y}`);
      
      setIsDrawing(false);
      
      // Remove temporary shape
      const objects = fabricCanvas.getObjects();
      const tempShape = objects.find(obj => (obj as any).isTemporary);
      if (tempShape) {
        fabricCanvas.remove(tempShape);
      }
      
      // Calculate final dimensions
      const width = Math.abs(pointer.x - startPoint.x);
      const height = Math.abs(pointer.y - startPoint.y);
      
      // Only create shape if it's big enough (reduced minimum size)
      if (width < 3 && height < 3) {
        console.log("Shape too small, not creating");
        setStartPoint(null);
        return;
      }
      
      const left = Math.min(pointer.x, startPoint.x);
      const top = Math.min(pointer.y, startPoint.y);
      const centerX = (pointer.x + startPoint.x) / 2;
      const centerY = (pointer.y + startPoint.y) / 2;

      let finalShape;
      const finalShapeOptions = {
        fill: 'transparent',
        stroke: getThemeColor(activeColor),
        strokeWidth,
        selectable: true,
        evented: true,
        hasControls: true,
        hasBorders: true,
      };

      // Create final shape
      switch (activeTool) {
        case 'rectangle':
          finalShape = new fabric.Rect({
            left,
            top,
            width,
            height,
            ...finalShapeOptions,
          });
          break;
        case 'circle': {
          const radius = Math.sqrt(Math.pow(pointer.x - startPoint.x, 2) + Math.pow(pointer.y - startPoint.y, 2)) / 2;
          finalShape = new fabric.Circle({
            left: centerX - radius,
            top: centerY - radius,
            radius: radius,
            ...finalShapeOptions,
          });
          break;
        }
        case 'line':
          finalShape = new fabric.Line([startPoint.x, startPoint.y, pointer.x, pointer.y], {
            stroke: getThemeColor(activeColor),
            strokeWidth,
            selectable: true,
            evented: true,
            hasControls: true,
            hasBorders: true,
          });
          break;
        case 'triangle':
          finalShape = new fabric.Triangle({
            left,
            top,
            width,
            height,
            ...finalShapeOptions,
          });
          break;
        case 'star': {
          const radius = Math.max(width, height) / 2;
          const starPoints = createStarPoints(0, 0, 5, radius, radius / 2);
          finalShape = new fabric.Polygon(starPoints, {
            ...finalShapeOptions,
            left: centerX - radius,
            top: centerY - radius,
          });
          break;
        }
        case 'pentagon': {
          const radius = Math.max(width, height) / 2;
          const pentagonPoints = createRegularPolygon(0, 0, 5, radius);
          finalShape = new fabric.Polygon(pentagonPoints, {
            ...finalShapeOptions,
            left: centerX - radius,
            top: centerY - radius,
          });
          break;
        }
        case 'hexagon': {
          const radius = Math.max(width, height) / 2;
          const hexagonPoints = createRegularPolygon(0, 0, 6, radius);
          finalShape = new fabric.Polygon(hexagonPoints, {
            ...finalShapeOptions,
            left: centerX - radius,
            top: centerY - radius,
          });
          break;
        }
        case 'diamond': {
          const diamondPoints = createDiamondPoints(0, 0, width, height);
          finalShape = new fabric.Polygon(diamondPoints, {
            ...finalShapeOptions,
            left: centerX - width / 2,
            top: centerY - height / 2,
          });
          break;
        }
      }

      if (finalShape) {
        fabricCanvas.add(finalShape);
        fabricCanvas.setActiveObject(finalShape);
        fabricCanvas.renderAll();
        console.log(`Created ${activeTool} shape successfully`);
        toast(`${activeTool} created!`);
      }
      
      setStartPoint(null);
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
  }, [fabricCanvas, activeTool, isDrawing, startPoint, activeColor, strokeWidth]);

  // Handle keyboard events for delete/backspace
  useEffect(() => {
    if (!fabricCanvas) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete') && fabricCanvas.getActiveObjects().length > 0) {
        const activeObjects = fabricCanvas.getActiveObjects();
        fabricCanvas.discardActiveObject();
        fabricCanvas.remove(...activeObjects);
        fabricCanvas.renderAll();
        toast("Objects deleted");
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [fabricCanvas]);

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
    
    // Enable object interaction for select and eraser tools
    fabricCanvas.getObjects().forEach(obj => {
      obj.set({
        selectable: activeTool === 'select',
        evented: activeTool === 'select' || activeTool === 'eraser',
        hasControls: activeTool === 'select',
        hasBorders: activeTool === 'select',
      });
    });

    // Set up eraser tool
    const handleEraserClick = (e: any) => {
      if (activeTool !== 'eraser') return;
      
      const pointer = fabricCanvas.getPointer(e.e);
      const target = fabricCanvas.findTarget(e);
      
      if (target) {
        fabricCanvas.remove(target);
        fabricCanvas.discardActiveObject();
        fabricCanvas.renderAll();
        console.log('Object erased at:', pointer.x, pointer.y);
        toast("Object erased");
      }
    };

    fabricCanvas.on('mouse:down', handleEraserClick);

    return () => {
      fabricCanvas.off('mouse:down', handleEraserClick);
    };
  }, [activeTool, fabricCanvas]);

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

  // Handle color change
  const handleColorChange = (color: string) => {
    setActiveColor(color);
    applyColorToSelected();
  };

  useEffect(() => {
    if (!fabricCanvas) return;

    const loadCanvasFromLocalStorage = () => {
      const savedCanvasData = localStorage.getItem("canvasData");
      if (savedCanvasData) {
        fabricCanvas.loadFromJSON(JSON.parse(savedCanvasData), () => {
          fabricCanvas.renderAll();
          console.log("Canvas loaded from local storage automatically");
        });
      }
    };

    // Automatically load canvas data on initialization
    loadCanvasFromLocalStorage();

    // Ensure canvas is displayed immediately
    fabricCanvas.renderAll();
  }, [fabricCanvas]);

  // Add keyboard shortcut support for tool selection
  useEffect(() => {
    const keyToTool = Object.entries(ICON_SHORTCUTS).reduce((acc, [tool, key]) => {
      acc[key] = tool;
      return acc;
    }, {} as Record<string, string>);

    const handleShortcut = (e: KeyboardEvent) => {
      console.log("Key pressed:", e.key);
      // Ignore if typing in an input or textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) return;
      if (keyToTool[e.key]) {
        setActiveTool(keyToTool[e.key] as Tool);
        toast(`Switched to ${(keyToTool[e.key] as string).charAt(0).toUpperCase() + (keyToTool[e.key] as string).slice(1)} tool`);
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [ICON_SHORTCUTS, setActiveTool]);

  return (
    <div className="relative w-full h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0" />
      
      {/* Responsive Floating Toolbar */}
      <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-10 
                      sm:top-2 sm:left-1/2 sm:transform sm:-translate-x-1/2
                      lg:top-4 lg:left-1/2 lg:transform lg:-translate-x-1/2">
        <Toolbar 
          activeTool={activeTool} 
          onToolClick={handleToolClick}
          onClear={handleClear}
          onUndo={handleUndo}
          onZoom={handleZoom}
          onShowAI={() => setShowAI(true)}
          onShowExport={() => setShowExport(true)}
          activeColor={activeColor}
          onColorChange={handleColorChange}
          strokeWidth={strokeWidth}
          onStrokeWidthChange={setStrokeWidth}
          canvas={fabricCanvas}
        />
      </div>

      {/* Responsive Theme Toggle */}
      <div className="absolute top-16 left-2 z-10
                      sm:top-4 sm:left-4
                      lg:top-4 lg:left-4">
        <ThemeToggle />
      </div>

      {/* AI Assistant Panel - Responsive */}
      {showAI && (
        <div className="fixed inset-0 z-50 lg:relative lg:inset-auto">
          <AIAssistant 
            canvas={fabricCanvas}
            onClose={() => setShowAI(false)}
            activeColor={getThemeColor(activeColor)}
          />
        </div>
      )}

      {/* Export Panel - Responsive */}
      {showExport && (
        <div className="fixed inset-0 z-50 lg:relative lg:inset-auto">
          <ExportPanel 
            canvas={fabricCanvas}
            onClose={() => setShowExport(false)}
          />
        </div>
      )}
    </div>
  );
};
