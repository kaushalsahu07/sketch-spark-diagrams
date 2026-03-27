import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import * as fabric from "fabric";
import { Toolbar } from "./Toolbar";
import { AIAssistant } from "./AIAssistant";
import { ExportPanel } from "./ExportPanel";
import { toast } from "sonner";
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

// Stable keyboard shortcuts mapping
const ICON_SHORTCUTS: Record<string, string> = {
  select: '1',
  rectangle: 'r',
  diamond: 'd',
  circle: 'c',
  line: 'l',
  triangle: '3',
  draw: '2',
  text: 't',
  eraser: '0',
  star: 's',
  pentagon: 'p',
  hexagon: 'h'
};

// Pre-compute reverse mapping (key -> tool) once
const KEY_TO_TOOL: Record<string, string> = Object.entries(ICON_SHORTCUTS).reduce(
  (acc, [tool, key]) => {
    acc[key] = tool;
    return acc;
  },
  {} as Record<string, string>
);

// Shape tools set for O(1) lookup
const SHAPE_TOOLS = new Set(['rectangle', 'circle', 'line', 'triangle', 'star', 'pentagon', 'hexagon', 'diamond']);

export const Canvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const [fabricCanvas, setFabricCanvas] = useState<fabric.Canvas | null>(null);
  const [activeColor, setActiveColor] = useState("#1e40af");
  const [activeTool, setActiveTool] = useState<Tool>("select");
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [showAI, setShowAI] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const { theme } = useTheme();

  // Shape drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);

  // Get theme-appropriate color
  const getThemeColor = useCallback((color: string) => {
    if (color !== "#000000" && color !== "#ffffff" && color !== "#1e40af") {
      return color;
    }
    return theme === 'dark' ? '#ffffff' : '#000000';
  }, [theme]);

  // Debounced save to localStorage
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveToLocalStorage = useCallback((canvas: fabric.Canvas) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      const jsonData = canvas.toJSON();
      localStorage.setItem('canvasData', JSON.stringify(jsonData));
    }, 300);
  }, []);

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

    // Load saved canvas data
    const savedData = localStorage.getItem('canvasData');
    if (savedData) {
      canvas.loadFromJSON(savedData, () => {
        canvas.renderAll();
      });
    }

    // Setup automatic saving (debounced)
    const handleSave = () => saveToLocalStorage(canvas);
    canvas.on('object:modified', handleSave);
    canvas.on('object:added', handleSave);
    canvas.on('object:removed', handleSave);

    // Initialize the drawing brush
    canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
    canvas.freeDrawingBrush.color = getThemeColor(activeColor);
    canvas.freeDrawingBrush.width = strokeWidth;

    fabricCanvasRef.current = canvas;
    setFabricCanvas(canvas);

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
      canvas.off('object:modified', handleSave);
      canvas.off('object:added', handleSave);
      canvas.off('object:removed', handleSave);
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
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

    if (fabricCanvas.freeDrawingBrush) {
      fabricCanvas.freeDrawingBrush.color = themeColor;
      fabricCanvas.freeDrawingBrush.width = strokeWidth;
    }
    
    fabricCanvas.renderAll();
  }, [activeColor, strokeWidth, theme, fabricCanvas]);

  // Apply color to selected object when color is explicitly changed
  const applyColorToSelected = useCallback(() => {
    if (!fabricCanvas) return;

    const themeColor = getThemeColor(activeColor);
    const activeObject = fabricCanvas.getActiveObject();
    
    if (activeObject) {
      if (activeObject.type === 'path') {
        activeObject.set({ stroke: themeColor });
      } else if (activeObject.type === 'textbox' || activeObject.type === 'text') {
        activeObject.set({ fill: themeColor });
      } else {
        const currentFill = activeObject.fill;
        if (currentFill === 'transparent' || currentFill === '' || !currentFill) {
          activeObject.set({ stroke: themeColor });
        } else {
          activeObject.set({ 
            fill: themeColor,
            stroke: themeColor 
          });
        }
      }
      fabricCanvas.renderAll();
    }
  }, [fabricCanvas, activeColor, getThemeColor]);

  // Helper function to create a regular polygon
  const createRegularPolygon = useCallback((centerX: number, centerY: number, sides: number, radius: number) => {
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
  }, []);

  // Helper function to create a star shape
  const createStarPoints = useCallback((centerX: number, centerY: number, points: number, outerRadius: number, innerRadius: number) => {
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
  }, []);

  // Helper function to create a diamond shape
  const createDiamondPoints = useCallback((centerX: number, centerY: number, width: number, height: number) => {
    return [
      { x: centerX, y: centerY - height / 2 },
      { x: centerX + width / 2, y: centerY },
      { x: centerX, y: centerY + height / 2 },
      { x: centerX - width / 2, y: centerY },
    ];
  }, []);

  // Check if current tool is a shape tool
  const isShapeTool = useCallback((tool: Tool): boolean => {
    return SHAPE_TOOLS.has(tool);
  }, []);

  // Create shape helper to reduce duplication
  const createShape = useCallback((
    activeTool: Tool,
    startPoint: { x: number; y: number },
    pointer: { x: number; y: number },
    options: Record<string, any>
  ) => {
    const width = Math.abs(pointer.x - startPoint.x);
    const height = Math.abs(pointer.y - startPoint.y);
    const left = Math.min(pointer.x, startPoint.x);
    const top = Math.min(pointer.y, startPoint.y);
    const centerX = (pointer.x + startPoint.x) / 2;
    const centerY = (pointer.y + startPoint.y) / 2;

    switch (activeTool) {
      case 'rectangle':
        return new fabric.Rect({ left, top, width, height, ...options });
      case 'circle': {
        const radius = Math.sqrt(Math.pow(pointer.x - startPoint.x, 2) + Math.pow(pointer.y - startPoint.y, 2)) / 2;
        return new fabric.Circle({ left: centerX - radius, top: centerY - radius, radius, ...options });
      }
      case 'line':
        return new fabric.Line([startPoint.x, startPoint.y, pointer.x, pointer.y], {
          stroke: options.stroke,
          strokeWidth: options.strokeWidth,
          selectable: options.selectable,
          evented: options.evented,
          ...(options.isTemporary !== undefined ? { isTemporary: options.isTemporary } : {}),
          ...(options.hasControls !== undefined ? { hasControls: options.hasControls } : {}),
          ...(options.hasBorders !== undefined ? { hasBorders: options.hasBorders } : {}),
        });
      case 'triangle':
        return new fabric.Triangle({ left, top, width, height, ...options });
      case 'star': {
        const r = Math.max(width, height) / 2;
        const starPts = createStarPoints(0, 0, 5, r, r / 2);
        return new fabric.Polygon(starPts, { ...options, left: centerX - r, top: centerY - r });
      }
      case 'pentagon': {
        const r = Math.max(width, height) / 2;
        const pentPts = createRegularPolygon(0, 0, 5, r);
        return new fabric.Polygon(pentPts, { ...options, left: centerX - r, top: centerY - r });
      }
      case 'hexagon': {
        const r = Math.max(width, height) / 2;
        const hexPts = createRegularPolygon(0, 0, 6, r);
        return new fabric.Polygon(hexPts, { ...options, left: centerX - r, top: centerY - r });
      }
      case 'diamond': {
        const dPts = createDiamondPoints(0, 0, width, height);
        return new fabric.Polygon(dPts, { ...options, left: centerX - width / 2, top: centerY - height / 2 });
      }
      default:
        return null;
    }
  }, [createRegularPolygon, createStarPoints, createDiamondPoints]);

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
        if (e.target) return;
        setIsDrawing(true);
        setStartPoint(pointer);
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

      const shapeOptions = {
        fill: 'transparent',
        stroke: getThemeColor(activeColor),
        strokeWidth,
        selectable: false,
        evented: false,
        isTemporary: true,
      };

      const shape = createShape(activeTool, startPoint, pointer, shapeOptions);
      if (shape) {
        fabricCanvas.add(shape);
        fabricCanvas.renderAll();
      }
    };

    const handleMouseUp = (e: any) => {
      if (!isDrawing || !startPoint || !isShapeTool(activeTool)) return;
      
      const pointer = fabricCanvas.getPointer(e.e);
      setIsDrawing(false);
      
      // Remove temporary shape
      const objects = fabricCanvas.getObjects();
      const tempShape = objects.find(obj => (obj as any).isTemporary);
      if (tempShape) {
        fabricCanvas.remove(tempShape);
      }
      
      const width = Math.abs(pointer.x - startPoint.x);
      const height = Math.abs(pointer.y - startPoint.y);
      
      // Only create shape if it's big enough
      if (width < 3 && height < 3) {
        setStartPoint(null);
        return;
      }

      const finalShapeOptions = {
        fill: 'transparent',
        stroke: getThemeColor(activeColor),
        strokeWidth,
        selectable: true,
        evented: true,
        hasControls: true,
        hasBorders: true,
      };

      const finalShape = createShape(activeTool, startPoint, pointer, finalShapeOptions);
      if (finalShape) {
        fabricCanvas.add(finalShape);
        fabricCanvas.setActiveObject(finalShape);
        fabricCanvas.renderAll();
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
  }, [fabricCanvas, activeTool, isDrawing, startPoint, activeColor, strokeWidth, createShape, isShapeTool, getThemeColor]);

  // Handle keyboard events for delete
  useEffect(() => {
    if (!fabricCanvas) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' && fabricCanvas.getActiveObjects().length > 0) {
        const activeObjects = fabricCanvas.getActiveObjects();
        fabricCanvas.discardActiveObject();
        fabricCanvas.remove(...activeObjects);
        fabricCanvas.renderAll();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fabricCanvas]);

  // Update tool setup
  useEffect(() => {
    if (!fabricCanvas) return;
    
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
      const target = fabricCanvas.findTarget(e);
      
      if (target) {
        fabricCanvas.remove(target);
        fabricCanvas.discardActiveObject();
        fabricCanvas.renderAll();
      }
    };

    fabricCanvas.on('mouse:down', handleEraserClick);
    return () => {
      fabricCanvas.off('mouse:down', handleEraserClick);
    };
  }, [activeTool, fabricCanvas]);

  // Handle tool selection
  const handleToolClick = useCallback((tool: Tool) => {
    setActiveTool(tool);
  }, []);

  // Handle canvas clear
  const handleClear = useCallback(() => {
    if (!fabricCanvas) return;
    fabricCanvas.clear();
    const canvasBackgroundColor = theme === 'dark' ? '#111827' : '#ffffff';
    fabricCanvas.backgroundColor = canvasBackgroundColor;
    fabricCanvas.renderAll();
    toast("Canvas cleared!");
  }, [fabricCanvas, theme]);

  // Handle undo
  const handleUndo = useCallback(() => {
    const objects = fabricCanvas?.getObjects();
    if (objects && objects.length > 0) {
      fabricCanvas?.remove(objects[objects.length - 1]);
      fabricCanvas?.renderAll();
    }
  }, [fabricCanvas]);

  // Handle zoom
  const handleZoom = useCallback((direction: 'in' | 'out') => {
    if (!fabricCanvas) return;
    const zoom = fabricCanvas.getZoom();
    const newZoom = direction === 'in' ? zoom * 1.1 : zoom * 0.9;
    fabricCanvas.setZoom(Math.min(Math.max(newZoom, 0.1), 5));
    fabricCanvas.renderAll();
  }, [fabricCanvas]);

  // Handle color change
  const handleColorChange = useCallback((color: string) => {
    setActiveColor(color);
    applyColorToSelected();
  }, [applyColorToSelected]);

  // Keyboard shortcut support for tool selection
  useEffect(() => {
    const handleShortcut = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) return;
      
      const tool = KEY_TO_TOOL[e.key];
      if (tool) {
        setActiveTool(tool as Tool);
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

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
