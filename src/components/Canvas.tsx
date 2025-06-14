import React, { useRef, useState, useEffect } from 'react';
import { Toolbar } from './Toolbar';
import { AIAssistant } from './AIAssistant';
import { ExportPanel } from './ExportPanel';
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { useTheme } from "@/contexts/ThemeContext";
import { SettingsMenu } from "./SettingsMenu";

export type Point = { x: number; y: number };
export type Tool = 'select' | 'draw' | 'rectangle' | 'circle' | 'line' | 'text' | 'eraser' | 'triangle' | 'star' | 'diamond' | 'pentagon' | 'hexagon';

const ZOOM_INCREMENT = 0.1;
const MAX_ZOOM = 3;
const MIN_ZOOM = 0.3;

export const Canvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);
  const [tool, setTool] = useState<Tool>('draw');
  const [color, setColor] = useState<string>('#1e40af');
  const [strokeWidth, setStrokeWidth] = useState<number>(3);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [isTextMode, setIsTextMode] = useState<boolean>(false);
  const [textPosition, setTextPosition] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [showAI, setShowAI] = useState<boolean>(false);
  const [showExport, setShowExport] = useState<boolean>(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const container = containerRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    const computedStyle = getComputedStyle(container!);
    const width = container!.offsetWidth - parseFloat(computedStyle.paddingLeft) - parseFloat(computedStyle.paddingRight);
    const height = container!.offsetHeight - parseFloat(computedStyle.paddingTop) - parseFloat(computedStyle.paddingBottom);

    canvas.width = width;
    canvas.height = height;

    context.lineCap = 'round';
    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);

    saveHistory();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    context.strokeStyle = color;
    context.lineWidth = strokeWidth;
  }, [color, strokeWidth]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (tool === 'text') {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      let x, y;

      if ('touches' in e) {
        x = e.touches[0].clientX - rect.left;
        y = e.touches[0].clientY - rect.top;
      } else {
        x = e.clientX - rect.left;
        y = e.clientY - rect.top;
      }

      setIsTextMode(true);
      setTextPosition({ x, y });
      setTimeout(() => textInputRef.current?.focus(), 0);
      return;
    }

    setIsDrawing(true);
    draw(e);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    context.strokeStyle = color;
    context.lineWidth = strokeWidth;

    const rect = canvas.getBoundingClientRect();
    let x, y;

    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    switch (tool) {
      case 'draw':
        context.beginPath();
        context.moveTo(x, y);
        context.lineTo(x + 1, y + 1);
        context.stroke();
        break;
      case 'eraser':
        context.clearRect(x - strokeWidth * 2, y - strokeWidth * 2, strokeWidth * 4, strokeWidth * 4);
        break;
      case 'rectangle':
        break;
      case 'circle':
        break;
      case 'line':
        break;
      default:
        break;
    }
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveHistory();
    }
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    startDrawing(e);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    draw(e);
  };

  const handleTouchEnd = () => {
    stopDrawing();
  };

  const handleTextBlur = () => {
    setIsTextMode(false);
    saveHistory();
  };

  const handleTextKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setIsTextMode(false);

      const canvas = canvasRef.current;
      if (!canvas) return;

      const context = canvas.getContext('2d');
      if (!context) return;

      context.font = `${strokeWidth * 8}px sans-serif`;
      context.fillStyle = color;
      context.fillText(e.currentTarget.value, textPosition.x, textPosition.y);
      saveHistory();
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);
    saveHistory();
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      const canvas = canvasRef.current;
      if (!canvas) return;

      const context = canvas.getContext('2d');
      if (!context) return;

      const img = new Image();
      img.src = history[historyIndex - 1];
      img.onload = () => {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(img, 0, 0);
      };
    }
  };

  const saveHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(canvas.toDataURL());

    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleZoom = (direction: 'in' | 'out') => {
    setZoom((prevZoom) => {
      const newZoom = direction === 'in' ? prevZoom + ZOOM_INCREMENT : prevZoom - ZOOM_INCREMENT;
      return Math.max(MIN_ZOOM, Math.min(newZoom, MAX_ZOOM));
    });
  };

  return (
    <div className="relative w-full min-h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Canvas Container */}
      <div className="relative w-full h-screen" ref={containerRef}>
        <canvas
          ref={canvasRef}
          className="absolute inset-0 cursor-crosshair touch-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />
        
        {isTextMode && (
          <input
            ref={textInputRef}
            type="text"
            className="absolute bg-transparent border-none outline-none text-black dark:text-white"
            style={{
              left: textPosition.x,
              top: textPosition.y,
              fontSize: `${strokeWidth * 8}px`,
              color: color,
            }}
            onBlur={handleTextBlur}
            onKeyDown={handleTextKeyDown}
            autoFocus
          />
        )}
      </div>

      {/* Toolbar - Mobile: Bottom, Desktop: Top Center */}
      <div className="fixed inset-x-0 bottom-4 sm:top-4 sm:bottom-auto z-30 px-4">
        <div className="flex justify-center">
          <Toolbar 
            activeTool={tool}
            onToolClick={setTool}
            onClear={clearCanvas}
            onUndo={undo}
            onZoom={handleZoom}
            onShowAI={() => setShowAI(true)}
            onShowExport={() => setShowExport(true)}
          />
        </div>
      </div>

      {/* Settings Menu - Top Right */}
      <SettingsMenu
        color={color}
        onChange={setColor}
        strokeWidth={strokeWidth}
        onStrokeWidthChange={setStrokeWidth}
      />

      {/* AI Assistant Sheet */}
      <Sheet open={showAI} onOpenChange={setShowAI}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <AIAssistant 
            canvas={null}
            onClose={() => setShowAI(false)}
            activeColor={color}
          />
        </SheetContent>
      </Sheet>

      {/* Export Panel Sheet */}
      <Sheet open={showExport} onOpenChange={setShowExport}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <ExportPanel 
            canvas={null}
            onClose={() => setShowExport(false)}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
};
