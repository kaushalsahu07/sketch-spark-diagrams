import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Check,
  X,
  MapPin,
  Crosshair,
  ArrowUpLeft,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowDownRight,
  Maximize2,
  MousePointer2,
  Sparkles,
} from "lucide-react";
import * as fabric from "fabric";
import { Canvas as FabricCanvas } from "fabric";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface DiagramPreviewProps {
  diagramJson: any;
  canvas: FabricCanvas | null;
  onAccept: () => void;
  onReject: () => void;
}

type PlacementOption = "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right" | "custom";

const PLACEMENT_OPTIONS: { id: PlacementOption; label: string; icon: React.ElementType }[] = [
  { id: "center", label: "Center", icon: Crosshair },
  { id: "top-left", label: "Top Left", icon: ArrowUpLeft },
  { id: "top-right", label: "Top Right", icon: ArrowUpRight },
  { id: "bottom-left", label: "Bottom Left", icon: ArrowDownLeft },
  { id: "bottom-right", label: "Bottom Right", icon: ArrowDownRight },
  { id: "custom", label: "Click to Place", icon: MousePointer2 },
];

export const DiagramPreview = ({ diagramJson, canvas, onAccept, onReject }: DiagramPreviewProps) => {
  const [phase, setPhase] = useState<"preview" | "placement">("preview");
  const [isPlacingCustom, setIsPlacingCustom] = useState(false);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewFabricRef = useRef<fabric.StaticCanvas | null>(null);

  // Render preview on a mini canvas
  useEffect(() => {
    if (!previewCanvasRef.current || !diagramJson?.objects) return;

    // Dispose previous preview canvas
    if (previewFabricRef.current) {
      previewFabricRef.current.dispose();
      previewFabricRef.current = null;
    }

    const previewCanvas = new fabric.StaticCanvas(previewCanvasRef.current, {
      width: 360,
      height: 240,
      backgroundColor: "#1a1f2e",
    });

    previewFabricRef.current = previewCanvas;

    try {
      const objects = diagramJson.objects.map((obj: any) => {
        let fabricObj: fabric.Object | null = null;
        switch (obj.type) {
          case "rect": {
            const { type, ...rest } = obj;
            fabricObj = new fabric.Rect(rest);
            break;
          }
          case "circle": {
            const { type, ...rest } = obj;
            fabricObj = new fabric.Circle(rest);
            break;
          }
          case "text": {
            const { type, ...rest } = obj;
            const textFill = obj.fill;
            const isDarkFill = !textFill || textFill === "black" || textFill === "#000" || textFill === "#000000";
            fabricObj = new fabric.IText(obj.text, {
              ...rest,
              fill: isDarkFill ? "white" : textFill,
              selectable: false,
              evented: false,
            });
            break;
          }
          case "line": {
            const { type, x1, y1, x2, y2, ...rest } = obj;
            fabricObj = new fabric.Line([x1, y1, x2, y2], rest);
            break;
          }
          case "path": {
            const { type, path, ...rest } = obj;
            fabricObj = new fabric.Path(path, rest);
            break;
          }
          default:
            return null;
        }
        if (fabricObj) {
          if (obj.fill) fabricObj.set("fill", obj.fill);
          if (obj.stroke) fabricObj.set("stroke", obj.stroke);
          if (obj.strokeWidth) fabricObj.set("strokeWidth", obj.strokeWidth);
          if (obj.opacity !== undefined) fabricObj.set("opacity", obj.opacity);
        }
        return fabricObj;
      }).filter((obj: fabric.Object | null): obj is fabric.Object => Boolean(obj));

      // Calculate bounding box to fit the preview
      if (objects.length > 0) {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        objects.forEach((obj: fabric.Object) => {
          const bound = obj.getBoundingRect();
          minX = Math.min(minX, bound.left);
          minY = Math.min(minY, bound.top);
          maxX = Math.max(maxX, bound.left + bound.width);
          maxY = Math.max(maxY, bound.top + bound.height);
        });

        const diagramWidth = maxX - minX;
        const diagramHeight = maxY - minY;
        const padding = 20;
        const scaleX = (360 - padding * 2) / diagramWidth;
        const scaleY = (240 - padding * 2) / diagramHeight;
        const scale = Math.min(scaleX, scaleY, 1);

        const offsetX = (360 - diagramWidth * scale) / 2 - minX * scale;
        const offsetY = (240 - diagramHeight * scale) / 2 - minY * scale;

        objects.forEach((obj: fabric.Object) => {
          obj.set({
            left: (obj.left || 0) * scale + offsetX,
            top: (obj.top || 0) * scale + offsetY,
            scaleX: (obj.scaleX || 1) * scale,
            scaleY: (obj.scaleY || 1) * scale,
          });
          obj.setCoords();
          previewCanvas.add(obj);
        });
      }

      previewCanvas.renderAll();
    } catch (err) {
      console.error("Error rendering preview:", err);
    }

    return () => {
      if (previewFabricRef.current) {
        previewFabricRef.current.dispose();
        previewFabricRef.current = null;
      }
    };
  }, [diagramJson]);

  // Add diagram objects to the main canvas at a specific position
  const addDiagramToCanvas = useCallback((targetX: number, targetY: number) => {
    if (!canvas || !diagramJson?.objects) return;

    try {
      const fabricObjects = diagramJson.objects.map((obj: any) => {
        let fabricObj: fabric.Object | null = null;
        switch (obj.type) {
          case "rect": {
            const { type, ...rest } = obj;
            fabricObj = new fabric.Rect(rest);
            break;
          }
          case "circle": {
            const { type, ...rest } = obj;
            fabricObj = new fabric.Circle(rest);
            break;
          }
          case "text": {
            const { type, ...rest } = obj;
            const textFill = obj.fill;
            const isDarkFill = !textFill || textFill === "black" || textFill === "#000" || textFill === "#000000";
            fabricObj = new fabric.IText(obj.text, {
              ...rest,
              fill: isDarkFill ? "white" : textFill,
              selectable: true,
              evented: true,
            });
            break;
          }
          case "line": {
            const { type, x1, y1, x2, y2, ...rest } = obj;
            fabricObj = new fabric.Line([x1, y1, x2, y2], rest);
            break;
          }
          case "path": {
            const { type, path, ...rest } = obj;
            fabricObj = new fabric.Path(path, rest);
            break;
          }
          default:
            return null;
        }
        if (fabricObj) {
          if (obj.fill) fabricObj.set("fill", obj.fill);
          if (obj.stroke) fabricObj.set("stroke", obj.stroke);
          if (obj.strokeWidth) fabricObj.set("strokeWidth", obj.strokeWidth);
          if (obj.opacity !== undefined) fabricObj.set("opacity", obj.opacity);
        }
        return fabricObj;
      }).filter((obj: fabric.Object | null): obj is fabric.Object => Boolean(obj));

      if (fabricObjects.length === 0) return;

      // Calculate diagram bounds
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      fabricObjects.forEach((obj: fabric.Object) => {
        const bound = obj.getBoundingRect();
        minX = Math.min(minX, bound.left);
        minY = Math.min(minY, bound.top);
        maxX = Math.max(maxX, bound.left + bound.width);
        maxY = Math.max(maxY, bound.top + bound.height);
      });

      const diagramWidth = maxX - minX;
      const diagramHeight = maxY - minY;

      // Offset to place the center of the diagram at (targetX, targetY)
      const offsetX = targetX - (minX + diagramWidth / 2);
      const offsetY = targetY - (minY + diagramHeight / 2);

      fabricObjects.forEach((obj: fabric.Object) => {
        obj.set({
          left: (obj.left || 0) + offsetX,
          top: (obj.top || 0) + offsetY,
        });
        obj.setCoords();
        canvas.add(obj);
      });

      canvas.renderAll();
      const canvasJson = canvas.toJSON();
      localStorage.setItem("canvasData", JSON.stringify(canvasJson));

      const objCount = fabricObjects.length;
      toast.success(`✨ Diagram placed with ${objCount} element${objCount !== 1 ? "s" : ""}!`);
      onAccept();
    } catch (error) {
      console.error("Error placing diagram on canvas:", error);
      toast.error("⚠️ Could not place the diagram. Try again.");
    }
  }, [canvas, diagramJson, onAccept]);

  // Handle preset placement
  const handlePresetPlacement = useCallback((placement: PlacementOption) => {
    if (!canvas) return;

    const canvasWidth = canvas.getWidth();
    const canvasHeight = canvas.getHeight();
    const margin = 80;

    let x: number, y: number;

    switch (placement) {
      case "center":
        x = canvasWidth / 2;
        y = canvasHeight / 2;
        break;
      case "top-left":
        x = margin + 120;
        y = margin + 80;
        break;
      case "top-right":
        x = canvasWidth - margin - 120;
        y = margin + 80;
        break;
      case "bottom-left":
        x = margin + 120;
        y = canvasHeight - margin - 80;
        break;
      case "bottom-right":
        x = canvasWidth - margin - 120;
        y = canvasHeight - margin - 80;
        break;
      case "custom":
        setIsPlacingCustom(true);
        return;
      default:
        x = canvasWidth / 2;
        y = canvasHeight / 2;
    }

    addDiagramToCanvas(x, y);
  }, [canvas, addDiagramToCanvas]);

  // Handle custom placement (click on canvas)
  useEffect(() => {
    if (!isPlacingCustom || !canvas) return;

    const handleCanvasClick = (e: any) => {
      const pointer = canvas.getPointer(e.e);
      setIsPlacingCustom(false);
      addDiagramToCanvas(pointer.x, pointer.y);
    };

    canvas.on("mouse:down", handleCanvasClick);
    canvas.defaultCursor = "crosshair";

    return () => {
      canvas.off("mouse:down", handleCanvasClick);
      canvas.defaultCursor = "default";
    };
  }, [isPlacingCustom, canvas, addDiagramToCanvas]);

  // Custom placement overlay
  if (isPlacingCustom) {
    return (
      <div className="fixed inset-0 z-[60] pointer-events-none">
        {/* Semi-transparent overlay */}
        <div className="absolute inset-0 bg-black/10 pointer-events-none" />

        {/* Floating instruction banner */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 pointer-events-auto">
          <Card className="px-6 py-4 bg-gradient-to-r from-violet-600/95 to-indigo-600/95 
            backdrop-blur-xl border-0 shadow-2xl shadow-violet-500/30 
            rounded-2xl animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Crosshair className="h-5 w-5 text-white animate-pulse" />
                <div className="absolute inset-0 bg-white/20 blur-md rounded-full animate-ping" />
              </div>
              <p className="text-white font-medium text-sm tracking-wide">
                Click anywhere on the canvas to place your diagram
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsPlacingCustom(false);
                  setPhase("placement");
                }}
                className="ml-2 text-white/80 hover:text-white hover:bg-white/20 
                  rounded-xl h-8 px-3 text-xs transition-all"
              >
                Cancel
              </Button>
            </div>
          </Card>
        </div>

        {/* Make canvas clickable */}
        <div className="absolute inset-0 pointer-events-auto cursor-crosshair" 
          style={{ zIndex: -1 }} />
      </div>
    );
  }

  // Preview phase — show diagram and Accept/Reject
  if (phase === "preview") {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm
        animate-in fade-in duration-300">
        <Card className="relative w-[420px] max-w-[95vw] overflow-hidden
          bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl
          border border-white/20 dark:border-gray-700/50
          shadow-2xl shadow-black/20 dark:shadow-black/50
          rounded-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
          
          {/* Header with gradient */}
          <div className="relative px-6 pt-5 pb-4">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-indigo-500/5 to-transparent 
              dark:from-violet-500/20 dark:via-indigo-500/10" />
            <div className="relative flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 
                  flex items-center justify-center shadow-lg shadow-violet-500/30">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full 
                  border-2 border-white dark:border-gray-900 animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
                  AI Diagram Preview
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {diagramJson?.objects?.length || 0} elements generated
                </p>
              </div>
            </div>
          </div>

          {/* Preview canvas */}
          <div className="mx-5 mb-4 rounded-xl overflow-hidden border border-gray-200/50 dark:border-gray-700/50
            shadow-inner bg-[#1a1f2e]">
            <canvas ref={previewCanvasRef} className="w-full" style={{ display: "block" }} />
          </div>

          {/* Action buttons */}
          <div className="px-5 pb-5 flex gap-3">
            <Button
              onClick={onReject}
              variant="ghost"
              className="flex-1 h-11 rounded-xl border border-gray-200 dark:border-gray-700
                text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400
                hover:border-red-200 dark:hover:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/30
                transition-all duration-300 group"
            >
              <X className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform duration-300" />
              Reject
            </Button>
            <Button
              onClick={() => setPhase("placement")}
              className="flex-1 h-11 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500
                hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-emerald-500/25
                hover:shadow-emerald-500/40 transition-all duration-300 hover:scale-[1.02]
                active:scale-[0.98] group"
            >
              <Check className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
              Accept & Place
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Placement phase — choose where to paste
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm
      animate-in fade-in duration-300">
      <Card className="relative w-[420px] max-w-[95vw] overflow-hidden
        bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl
        border border-white/20 dark:border-gray-700/50
        shadow-2xl shadow-black/20 dark:shadow-black/50
        rounded-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
        
        {/* Header */}
        <div className="relative px-6 pt-5 pb-4">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-cyan-500/5 to-transparent 
            dark:from-blue-500/20 dark:via-cyan-500/10" />
          <div className="relative flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 
              flex items-center justify-center shadow-lg shadow-blue-500/30">
              <MapPin className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
                Choose Placement
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Select where to place the diagram on your canvas
              </p>
            </div>
          </div>
        </div>

        {/* Placement grid */}
        <div className="px-5 pb-3">
          <div className="grid grid-cols-3 gap-2.5">
            {PLACEMENT_OPTIONS.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.id}
                  onClick={() => handlePresetPlacement(option.id)}
                  className={cn(
                    "group relative flex flex-col items-center gap-2 p-4 rounded-xl",
                    "border border-gray-200/70 dark:border-gray-700/50",
                    "hover:border-blue-300 dark:hover:border-blue-600",
                    "bg-gray-50/50 dark:bg-gray-800/30",
                    "hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50",
                    "dark:hover:from-blue-950/30 dark:hover:to-indigo-950/30",
                    "transition-all duration-300 hover:scale-[1.03] active:scale-[0.97]",
                    "hover:shadow-lg hover:shadow-blue-500/10",
                    option.id === "custom" && "col-span-3 flex-row justify-center gap-3 py-3 border-dashed border-2"
                  )}
                >
                  <div className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center",
                    "bg-gray-100 dark:bg-gray-700/50",
                    "group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40",
                    "transition-all duration-300",
                    option.id === "custom" && "w-8 h-8"
                  )}>
                    <Icon className={cn(
                      "h-4 w-4 text-gray-500 dark:text-gray-400",
                      "group-hover:text-blue-600 dark:group-hover:text-blue-400",
                      "transition-colors duration-300",
                      option.id === "custom" && "animate-pulse"
                    )} />
                  </div>
                  <span className={cn(
                    "text-xs font-medium text-gray-600 dark:text-gray-400",
                    "group-hover:text-blue-700 dark:group-hover:text-blue-300",
                    "transition-colors duration-300"
                  )}>
                    {option.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Back button */}
        <div className="px-5 pb-5">
          <Button
            variant="ghost"
            onClick={() => setPhase("preview")}
            className="w-full h-10 rounded-xl text-gray-500 dark:text-gray-400
              hover:text-gray-700 dark:hover:text-gray-200
              hover:bg-gray-100 dark:hover:bg-gray-800
              transition-all duration-200 text-sm"
          >
            ← Back to Preview
          </Button>
        </div>
      </Card>
    </div>
  );
};
