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

  // Eraser functionality
  const eraseObjectsAtPoint = (point: { x: number; y: number }) => {
    if (!fabricCanvas) return;

    const eraserSize = strokeWidth * 2; // Make eraser size relative to stroke width
    const objects = fabricCanvas.getObjects();
    let removed = false;

    // Check each object for intersection with eraser
    for (let i = objects.length - 1; i >= 0; i--) {
      const obj = objects[i];
      if (!obj) continue;

      // Get object bounds and absolute position
      const objBounds = obj.getBoundingRect();
      
      // For path objects (drawn lines), use a more precise hit detection
      if (obj.type === 'path') {
        const fabricPoint = new fabric.Point(point.x, point.y);
        if (obj.containsPoint(fabricPoint)) {
          fabricCanvas.remove(obj);
          removed = true;
          continue;
        }
      }
      
      // For other objects, use bounding box with padding
      const intersects = point.x >= objBounds.left - eraserSize &&
                        point.x <= objBounds.left + objBounds.width + eraserSize &&
                        point.y >= objBounds.top - eraserSize &&
                        point.y <= objBounds.top + objBounds.height + eraserSize;

      if (intersects) {
        fabricCanvas.remove(obj);
        removed = true;
      }
    }

    if (removed) {
      fabricCanvas.requestRenderAll();
    }
  };

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
    
    // Enable object interaction for eraser
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
    } else if (activeTool === "eraser") {
      fabricCanvas.defaultCursor = 'crosshair';
      toast("Eraser activated! Click and drag to erase objects");
      
      const handleMouseDown = (e: any) => {
        if (activeTool !== "eraser") return;
        setIsErasing(true);
        const point = fabricCanvas.getPointer(e.e);
        eraseObjectsAtPoint(point);
      };

      const handleMouseMove = (e: any) => {
        if (activeTool !== "eraser" || !isErasing) return;
        const point = fabricCanvas.getPointer(e.e);
        eraseObjectsAtPoint(point);
      };

      const handleMouseUp = () => {
        if (activeTool !== "eraser") return;
        setIsErasing(false);
      };

      fabricCanvas.on('mouse:down', handleMouseDown);
      fabricCanvas.on('mouse:move', handleMouseMove);
      fabricCanvas.on('mouse:up', handleMouseUp);

      return () => {
        fabricCanvas.off('mouse:down', handleMouseDown);
        fabricCanvas.off('mouse:move', handleMouseMove);
        fabricCanvas.off('mouse:up', handleMouseUp);
      };
    }
  }, [activeTool, fabricCanvas, strokeWidth]);

  const applyEraserEffect = (prevPoint: {x: number, y: number}, currentPoint: {x: number, y: number}) => {
    if (!fabricCanvas) return;
    
    // Increase eraser radius for better precision control
    const eraserRadius = strokeWidth * 3;
    const objects = fabricCanvas.getObjects().slice();
    
    // Create a line segment representing the eraser path for better collision detection
    const eraserPath = {
      start: prevPoint,
      end: currentPoint
    };
    
    objects.forEach(obj => {
      // Check if the eraser path intersects with the object
      if (isEraserPathIntersectingObject(obj, eraserPath, eraserRadius)) {
        eraseFromObject(obj, prevPoint, currentPoint, eraserRadius);
      }
    });
    
    fabricCanvas.renderAll();
  };
  
  // Enhanced intersection detection between eraser path and objects
  const isEraserPathIntersectingObject = (obj: any, eraserPath: {start: {x: number, y: number}, end: {x: number, y: number}}, radius: number): boolean => {
    // Get object bounds
    const bounds = obj.getBoundingRect();
    
    // Quick rejection test using bounding boxes
    const eraserBounds = {
      left: Math.min(eraserPath.start.x, eraserPath.end.x) - radius,
      top: Math.min(eraserPath.start.y, eraserPath.end.y) - radius,
      width: Math.abs(eraserPath.end.x - eraserPath.start.x) + radius * 2,
      height: Math.abs(eraserPath.end.y - eraserPath.start.y) + radius * 2
    };
    
    // Check if bounding boxes intersect
    if (!(eraserBounds.left <= bounds.left + bounds.width &&
          eraserBounds.left + eraserBounds.width >= bounds.left &&
          eraserBounds.top <= bounds.top + bounds.height &&
          eraserBounds.top + eraserBounds.height >= bounds.top)) {
      return false;
    }
    
    // For paths, check if any point on the path is near the eraser
    if (obj.type === 'path' && obj.path) {
      // Sample points along the path
      const pathPoints = samplePointsFromPath(obj);
      for (const point of pathPoints) {
        if (distancePointToLine(point, eraserPath.start, eraserPath.end) <= radius) {
          return true;
        }
      }
    }
    
    // For lines, check direct intersection
    if (obj.type === 'line') {
      const x1 = obj.x1 + obj.left;
      const y1 = obj.y1 + obj.top;
      const x2 = obj.x2 + obj.left;
      const y2 = obj.y2 + obj.top;
      
      // Check if line segments intersect or are close enough
      return doLineSegmentsIntersect(
        eraserPath.start.x, eraserPath.start.y, 
        eraserPath.end.x, eraserPath.end.y,
        x1, y1, x2, y2, radius
      );
    }
    
    // For other shapes, check if any point on the eraser path is inside or near the object
    const midPoint = {
      x: (eraserPath.start.x + eraserPath.end.x) / 2,
      y: (eraserPath.start.y + eraserPath.end.y) / 2
    };
    
    return isPointNearObject(obj, eraserPath.start, radius) || 
           isPointNearObject(obj, midPoint, radius) || 
           isPointNearObject(obj, eraserPath.end, radius);
  };
  
  // Sample points from a path object for intersection testing
  const samplePointsFromPath = (pathObj: any): {x: number, y: number}[] => {
    const points: {x: number, y: number}[] = [];
    const path = pathObj.path;
    const left = pathObj.left || 0;
    const top = pathObj.top || 0;
    
    if (!path || !Array.isArray(path)) return points;
    
    // Sample points along the path
    for (let i = 0; i < path.length; i++) {
      const cmd = path[i];
      if (cmd[0] === 'M' || cmd[0] === 'L') {
        points.push({ x: cmd[1] + left, y: cmd[2] + top });
      } else if (cmd[0] === 'Q') {
        // Sample quadratic curve
        points.push({ x: cmd[1] + left, y: cmd[2] + top });
        points.push({ x: cmd[3] + left, y: cmd[4] + top });
      } else if (cmd[0] === 'C') {
        // Sample cubic curve
        points.push({ x: cmd[1] + left, y: cmd[2] + top });
        points.push({ x: cmd[3] + left, y: cmd[4] + top });
        points.push({ x: cmd[5] + left, y: cmd[6] + top });
      }
    }
    
    return points;
  };
  
  // Check if two line segments intersect or are within a certain distance
  const doLineSegmentsIntersect = (
    x1: number, y1: number, x2: number, y2: number,
    x3: number, y3: number, x4: number, y4: number,
    tolerance: number
  ): boolean => {
    // Direct intersection check
    const denominator = ((y4 - y3) * (x2 - x1)) - ((x4 - x3) * (y2 - y1));
    if (denominator === 0) {
      // Lines are parallel, check minimum distance
      const distance = distancePointToLine({x: x1, y: y1}, {x: x3, y: x3}, {x: x4, y: y4});
      return distance <= tolerance;
    }
    
    const ua = (((x4 - x3) * (y1 - y3)) - ((y4 - y3) * (x1 - x3))) / denominator;
    const ub = (((x2 - x1) * (y1 - y3)) - ((y2 - y1) * (x1 - x3))) / denominator;
    
    // Check if intersection point is on both line segments
    if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
      return true;
    }
    
    // If no direct intersection, check minimum distance
    const minDist = Math.min(
      distancePointToLine({x: x1, y: y1}, {x: x3, y: y3}, {x: x4, y: y4}),
      distancePointToLine({x: x2, y: y2}, {x: x3, y: y3}, {x: x4, y: y4}),
      distancePointToLine({x: x3, y: y3}, {x: x1, y: y1}, {x: x2, y: y2}),
      distancePointToLine({x: x4, y: y4}, {x: x1, y: y1}, {x: x2, y: y2})
    );
    
    return minDist <= tolerance;
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

    // For paths (drawings), apply precise path-based erasing
    if (obj.type === 'path') {
      erasePathSegment(obj, prevPoint, currentPoint, radius);
    } 
    // For lines, split them at intersection points
    else if (obj.type === 'line') {
      eraseLine(obj, prevPoint, currentPoint, radius);
    }
    // For circles, create partial circles or apply clipping
    else if (obj.type === 'circle') {
      eraseCircle(obj, prevPoint, currentPoint, radius);
    }
    // For rectangles, split into smaller shapes
    else if (obj.type === 'rect') {
      eraseRectangle(obj, prevPoint, currentPoint, radius);
    }
    // For other shapes, use a more gradual opacity reduction
    else {
      const currentOpacity = obj.opacity || 1;
      const newOpacity = Math.max(0, currentOpacity - 0.08);
      
      if (newOpacity <= 0.1) {
        fabricCanvas.remove(obj);
      } else {
        obj.set('opacity', newOpacity);
      }
    }
  };
  
  // Enhanced path erasing that splits paths at intersection points
  const erasePathSegment = (pathObj: any, prevPoint: {x: number, y: number}, currentPoint: {x: number, y: number}, radius: number) => {
    if (!fabricCanvas || !pathObj.path) return;
    
    // Get path data
    const path = pathObj.path;
    const left = pathObj.left || 0;
    const top = pathObj.top || 0;
    
    // Create eraser line segment
    const eraserLine = {
      x1: prevPoint.x,
      y1: prevPoint.y,
      x2: currentPoint.x,
      y2: currentPoint.y
    };
    
    // Check if any path segments intersect with the eraser
    let hasIntersection = false;
    const pathPoints = samplePointsFromPath(pathObj);
    
    for (const point of pathPoints) {
      if (distancePointToLine(point, {x: eraserLine.x1, y: eraserLine.y1}, {x: eraserLine.x2, y: eraserLine.y2}) <= radius) {
        hasIntersection = true;
        break;
      }
    }
    
    if (hasIntersection) {
      // For complex path erasing, we'll use a more sophisticated approach
      // by creating a clipping path or reducing opacity in the affected area
      
      // Calculate the center of the eraser stroke
      const centerX = (eraserLine.x1 + eraserLine.x2) / 2;
      const centerY = (eraserLine.y1 + eraserLine.y2) / 2;
      
      // Calculate distance from path center to eraser center
      const pathBounds = pathObj.getBoundingRect();
      const pathCenterX = pathBounds.left + pathBounds.width / 2;
      const pathCenterY = pathBounds.top + pathBounds.height / 2;
      
      // Calculate distance factor (closer = more opacity reduction)
      const distance = Math.sqrt(Math.pow(centerX - pathCenterX, 2) + Math.pow(centerY - pathCenterY, 2));
      const maxDistance = Math.sqrt(Math.pow(pathBounds.width, 2) + Math.pow(pathBounds.height, 2)) / 2;
      const factor = Math.min(1, distance / maxDistance);
      
      // Apply graduated opacity reduction based on proximity
      const currentOpacity = pathObj.opacity || 1;
      const opacityReduction = 0.15 * (1 - factor);
      const newOpacity = Math.max(0, currentOpacity - opacityReduction);
      
      if (newOpacity <= 0.1) {
        fabricCanvas.remove(pathObj);
      } else {
        pathObj.set('opacity', newOpacity);
      }
    }
  };
  
  // Enhanced circle erasing that creates partial circles
  const eraseCircle = (circleObj: any, prevPoint: {x: number, y: number}, currentPoint: {x: number, y: number}, radius: number) => {
    if (!fabricCanvas) return;
    
    // Get circle properties
    const cx = circleObj.left + circleObj.radius;
    const cy = circleObj.top + circleObj.radius;
    const cr = circleObj.radius;
    
    // Calculate distance from circle center to eraser line
    const distance = distancePointToLine({x: cx, y: cy}, prevPoint, currentPoint);
    
    // If eraser is close to the edge of the circle
    if (Math.abs(distance - cr) < radius) {
      // For now, we'll use opacity reduction as a simpler approach
      // In a more advanced implementation, we could create arc segments
      const currentOpacity = circleObj.opacity || 1;
      const newOpacity = Math.max(0, currentOpacity - 0.1);
      
      if (newOpacity <= 0.1) {
        fabricCanvas.remove(circleObj);
      } else {
        circleObj.set('opacity', newOpacity);
      }
    }
  };
  
  // Enhanced rectangle erasing that splits rectangles
  const eraseRectangle = (rectObj: any, prevPoint: {x: number, y: number}, currentPoint: {x: number, y: number}, radius: number) => {
    if (!fabricCanvas) return;
    
    // Get rectangle corners
    const left = rectObj.left;
    const top = rectObj.top;
    const right = left + rectObj.width;
    const bottom = top + rectObj.height;
    
    // Create rectangle edges as line segments
    const edges = [
      {x1: left, y1: top, x2: right, y2: top},       // top edge
      {x1: right, y1: top, x2: right, y2: bottom},     // right edge
      {x1: right, y1: bottom, x2: left, y2: bottom},   // bottom edge
      {x1: left, y1: bottom, x2: left, y2: top}        // left edge
    ];
    
    // Check if eraser intersects with any edge
    let intersectsEdge = false;
    for (const edge of edges) {
      if (doLineSegmentsIntersect(
        prevPoint.x, prevPoint.y, currentPoint.x, currentPoint.y,
        edge.x1, edge.y1, edge.x2, edge.y2,
        radius
      )) {
        intersectsEdge = true;
        break;
      }
    }
    
    if (intersectsEdge) {
      // For now, we'll use opacity reduction as a simpler approach
      // In a more advanced implementation, we could split the rectangle
      const currentOpacity = rectObj.opacity || 1;
      const newOpacity = Math.max(0, currentOpacity - 0.1);
      
      if (newOpacity <= 0.1) {
        fabricCanvas.remove(rectObj);
      } else {
        rectObj.set('opacity', newOpacity);
      }
    }
  };
  
  // Remove the old applyEraserMask function as it's replaced by erasePathSegment

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
    
    // Create eraser line segment for better intersection detection
    const eraserLine = {
      x1: prevPoint.x,
      y1: prevPoint.y,
      x2: currentPoint.x,
      y2: currentPoint.y
    };
    
    // Check if eraser path intersects with the line
    const intersects = doLineSegmentsIntersect(
      eraserLine.x1, eraserLine.y1, eraserLine.x2, eraserLine.y2,
      x1, y1, x2, y2,
      radius
    );
    
    if (intersects) {
      // Find the closest point on the line to the eraser path
      const closestPoint = findClosestPointOnLineSegment(
        eraserLine.x1, eraserLine.y1, eraserLine.x2, eraserLine.y2,
        x1, y1, x2, y2
      );
      
      // Calculate the parameter t along the line (0 at start, 1 at end)
      const t = findProjectionParameter(closestPoint, {x: x1, y: y1}, {x: x2, y: y2});
      
      // Only split the line if the intersection is not too close to the endpoints
      if (t > 0.1 && t < 0.9) {
        // Calculate the exact intersection point
        const intersectionX = x1 + t * (x2 - x1);
        const intersectionY = y1 + t * (y2 - y1);
        
        // Calculate the gap size based on eraser radius
        const gapSize = radius * 0.8; // Slightly smaller than radius for visual effect
        
        // Calculate gap endpoints
        const lineLength = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        const normalizedDirX = (x2 - x1) / lineLength;
        const normalizedDirY = (y2 - y1) / lineLength;
        
        const gapStart = {
          x: intersectionX - normalizedDirX * gapSize,
          y: intersectionY - normalizedDirY * gapSize
        };
        
        const gapEnd = {
          x: intersectionX + normalizedDirX * gapSize,
          y: intersectionY + normalizedDirY * gapSize
        };
        
        // Remove the original line
        fabricCanvas.remove(lineObj);
        
        // Create first segment (before gap)
        const distToStart = Math.sqrt(Math.pow(gapStart.x - x1, 2) + Math.pow(gapStart.y - y1, 2));
        if (distToStart > 5) { // Only create if segment is long enough
          const line1 = new fabric.Line(
            [x1 - lineObj.left, y1 - lineObj.top, gapStart.x - lineObj.left, gapStart.y - lineObj.top], 
            {
              stroke: lineObj.stroke,
              strokeWidth: lineObj.strokeWidth,
              left: lineObj.left,
              top: lineObj.top,
              selectable: lineObj.selectable,
              evented: lineObj.evented
            }
          );
          fabricCanvas.add(line1);
        }
        
        // Create second segment (after gap)
        const distToEnd = Math.sqrt(Math.pow(x2 - gapEnd.x, 2) + Math.pow(y2 - gapEnd.y, 2));
        if (distToEnd > 5) { // Only create if segment is long enough
          const line2 = new fabric.Line(
            [gapEnd.x - lineObj.left, gapEnd.y - lineObj.top, x2 - lineObj.left, y2 - lineObj.top], 
            {
              stroke: lineObj.stroke,
              strokeWidth: lineObj.strokeWidth,
              left: lineObj.left,
              top: lineObj.top,
              selectable: lineObj.selectable,
              evented: lineObj.evented
            }
          );
          fabricCanvas.add(line2);
        }
      } else {
        // For intersections near endpoints, reduce opacity or remove part of the line
        const currentOpacity = lineObj.opacity || 1;
        const newOpacity = Math.max(0, currentOpacity - 0.15);
        
        if (newOpacity <= 0.1) {
          fabricCanvas.remove(lineObj);
        } else {
          lineObj.set('opacity', newOpacity);
        }
      }
    }
  };
  
  // Helper function to find the closest point on a line segment to another line segment
  const findClosestPointOnLineSegment = (
    l1x1: number, l1y1: number, l1x2: number, l1y2: number,
    l2x1: number, l2y1: number, l2x2: number, l2y2: number
  ): {x: number, y: number} => {
    // Find the closest point from line 1 to line 2
    const points = [
      {x: l2x1, y: l2y1},
      {x: l2x2, y: l2y2}
    ];
    
    // Find the midpoint of line 1
    const midpoint = {
      x: (l1x1 + l1x2) / 2,
      y: (l1y1 + l1y2) / 2
    };
    
    // Find the closest point on line 2 to the midpoint of line 1
    const t = findProjectionParameter(midpoint, {x: l2x1, y: l2y1}, {x: l2x2, y: l2y2});
    const clampedT = Math.max(0, Math.min(1, t));
    
    return {
      x: l2x1 + clampedT * (l2x2 - l2x1),
      y: l2y1 + clampedT * (l2y2 - l2y1)
    };
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
  
      case 'ellipse':
        shape = new fabric.Ellipse({
          left: centerX - width / 2,
          top: centerY - height / 2,
          rx: width / 2,
          ry: height / 2,
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
          centerX,
          centerY,
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
          centerX,
          centerY,
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
          centerX,
          centerY,
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
          centerX,
          centerY,
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

  // Function to set selection properties for new objects
  const setObjectSelectionProperties = (obj: any) => {
    obj.set({
      selectable: activeTool === 'select',
      evented: activeTool === 'select' || activeTool === 'eraser',
      hasControls: activeTool === 'select',
      hasBorders: activeTool === 'select',
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

  // Handle tool selection
  const handleToolClick = (tool: Tool) => {
    console.log("Tool clicked:", tool);
    setActiveTool(tool);
    // For text tool, text will be created on canvas click, not here
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

  // Setup shape and text drawing handlers
  useEffect(() => {
    if (!fabricCanvas) return;

    const handleMouseDown = (e: any) => {
      // Skip if clicking on an existing object or using select/draw/eraser tools
      if (e.target || activeTool === 'select' || activeTool === 'draw' || activeTool === 'eraser') return;

      // For text tool, create text at click position
      if (activeTool === 'text') {
        const pointer = fabricCanvas.getPointer(e.e);
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
        // Switch to select tool after creating text
        setActiveTool('select');
        return;
      }

      // For shape tools, start shape creation
      setIsDrawing(true);
      const pointer = fabricCanvas.getPointer(e.e);
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
    };

    const handleMouseMove = (e: any) => {
      if (!isDrawing || !startPoint || !activeShape) return;

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
        case 'ellipse': {
          activeShape.set({
            left: centerX - absWidth / 2,
            top: centerY - absHeight / 2,
            rx: absWidth / 2,
            ry: absHeight / 2,
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
      if (!isDrawing) return;
      
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

  // Handle text creation and editing
  const handleTextDoubleClick = (e: any) => {
    if (!fabricCanvas) return;
    
    // Only create new text when text tool is active
    if (activeTool === 'text' && !e.target) {
      const pointer = fabricCanvas.getPointer(e.e);
      const textbox = new fabric.Textbox('Type here', {
        left: pointer.x,
        top: pointer.y,
        fontSize: 20,
        fill: getThemeColor(activeColor),
        width: 200,
        editingBorderColor: getThemeColor(activeColor),
        borderColor: getThemeColor(activeColor),
        cursorColor: getThemeColor(activeColor),
      });

      fabricCanvas.add(textbox);
      fabricCanvas.setActiveObject(textbox);
      textbox.enterEditing();
      textbox.selectAll();
    }
    // Allow editing existing text objects regardless of active tool
    else if (e.target && e.target.type === 'textbox') {
      // When text tool is active, select all text for immediate typing
      if (activeTool === 'text') {
        e.target.enterEditing();
        e.target.selectAll();
      } 
      // For other tools, just enter editing mode without selecting all
      else {
        e.target.enterEditing();
      }
    }
  };

  // Setup text editing handlers
  useEffect(() => {
    if (!fabricCanvas) return;

    // Handle double click for both new and existing text
    fabricCanvas.on('mouse:dblclick', handleTextDoubleClick);

    // Update text properties when entering edit mode
    fabricCanvas.on('text:editing:entered', (e: any) => {
      if (!e.target) return;
      e.target.set({
        backgroundColor: theme === 'dark' ? 'rgba(17, 24, 39, 0.7)' : 'rgba(255, 255, 255, 0.7)'
      });
      fabricCanvas.requestRenderAll();
    });

    // Clean up text properties when exiting edit mode
    fabricCanvas.on('text:editing:exited', (e: any) => {
      if (!e.target) return;
      e.target.set({
        backgroundColor: 'transparent'
      });
      // Remove empty text objects
      if (e.target.text.trim() === '') {
        fabricCanvas.remove(e.target);
      }
      fabricCanvas.requestRenderAll();
    });

    return () => {
      fabricCanvas.off('mouse:dblclick', handleTextDoubleClick);
      fabricCanvas.off('text:editing:entered');
      fabricCanvas.off('text:editing:exited');
    };
  }, [fabricCanvas, activeTool, theme]);

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
