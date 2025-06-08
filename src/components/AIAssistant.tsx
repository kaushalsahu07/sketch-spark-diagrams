import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { X, Send, Sparkles } from "lucide-react";
import { Canvas as FabricCanvas, Rect, Circle, Line, Textbox } from "fabric";
import { toast } from "sonner";

interface AIAssistantProps {
  canvas: FabricCanvas | null;
  onClose: () => void;
  activeColor: string;
}

export const AIAssistant = ({ canvas, onClose, activeColor }: AIAssistantProps) => {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const generateDiagram = async () => {
    if (!canvas || !prompt.trim()) return;

    setIsGenerating(true);
    
    try {
      // Simple diagram generation based on keywords
      const lowerPrompt = prompt.toLowerCase();
      
      if (lowerPrompt.includes("flowchart") || lowerPrompt.includes("flow")) {
        createFlowchart();
      } else if (lowerPrompt.includes("uml") || lowerPrompt.includes("class")) {
        createUMLDiagram();
      } else if (lowerPrompt.includes("process") || lowerPrompt.includes("workflow")) {
        createProcessDiagram();
      } else if (lowerPrompt.includes("network") || lowerPrompt.includes("architecture")) {
        createNetworkDiagram();
      } else {
        createBasicDiagram();
      }
      
      toast("Diagram generated successfully!");
      setPrompt("");
    } catch (error) {
      toast("Failed to generate diagram. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const createFlowchart = () => {
    if (!canvas) return;
    
    const startX = 100;
    const startY = 100;
    
    // Start box
    const start = new Rect({
      left: startX,
      top: startY,
      fill: "transparent",
      stroke: activeColor,
      strokeWidth: 2,
      width: 120,
      height: 60,
      rx: 30,
    });
    canvas.add(start);
    
    canvas.add(new Textbox("Start", {
      left: startX + 40,
      top: startY + 20,
      fill: activeColor,
      fontSize: 14,
      fontFamily: "Inter, sans-serif",
    }));
    
    // Arrow
    canvas.add(new Line([startX + 60, startY + 60, startX + 60, startY + 120], {
      stroke: activeColor,
      strokeWidth: 2,
    }));
    
    // Process box
    const process = new Rect({
      left: startX,
      top: startY + 120,
      fill: "transparent",
      stroke: activeColor,
      strokeWidth: 2,
      width: 120,
      height: 60,
    });
    canvas.add(process);
    
    canvas.add(new Textbox("Process", {
      left: startX + 30,
      top: startY + 140,
      fill: activeColor,
      fontSize: 14,
      fontFamily: "Inter, sans-serif",
    }));
    
    canvas.renderAll();
  };

  const createUMLDiagram = () => {
    if (!canvas) return;
    
    const classBox = new Rect({
      left: 100,
      top: 100,
      fill: "transparent",
      stroke: activeColor,
      strokeWidth: 2,
      width: 200,
      height: 150,
    });
    canvas.add(classBox);
    
    canvas.add(new Textbox("User", {
      left: 160,
      top: 110,
      fill: activeColor,
      fontSize: 16,
      fontWeight: 'bold',
      fontFamily: "Inter, sans-serif",
    }));
    
    canvas.add(new Line([100, 140, 300, 140], {
      stroke: activeColor,
      strokeWidth: 1,
    }));
    
    canvas.add(new Textbox("- username: string\n- email: string\n- password: string", {
      left: 110,
      top: 150,
      fill: activeColor,
      fontSize: 12,
      fontFamily: "Inter, sans-serif",
    }));
    
    canvas.add(new Line([100, 200, 300, 200], {
      stroke: activeColor,
      strokeWidth: 1,
    }));
    
    canvas.add(new Textbox("+ login()\n+ logout()\n+ register()", {
      left: 110,
      top: 210,
      fill: activeColor,
      fontSize: 12,
      fontFamily: "Inter, sans-serif",
    }));
    
    canvas.renderAll();
  };

  const createProcessDiagram = () => {
    if (!canvas) return;
    
    const steps = ["Input", "Validate", "Process", "Output"];
    const startX = 50;
    const startY = 150;
    const spacing = 150;
    
    steps.forEach((step, index) => {
      const x = startX + (index * spacing);
      
      // Circle for each step
      const circle = new Circle({
        left: x,
        top: startY,
        fill: "transparent",
        stroke: activeColor,
        strokeWidth: 2,
        radius: 40,
      });
      canvas.add(circle);
      
      canvas.add(new Textbox(step, {
        left: x - step.length * 3,
        top: startY + 30,
        fill: activeColor,
        fontSize: 12,
        fontFamily: "Inter, sans-serif",
      }));
      
      // Arrow to next step
      if (index < steps.length - 1) {
        canvas.add(new Line([x + 80, startY + 40, x + 70 + spacing, startY + 40], {
          stroke: activeColor,
          strokeWidth: 2,
        }));
      }
    });
    
    canvas.renderAll();
  };

  const createNetworkDiagram = () => {
    if (!canvas) return;
    
    // Server
    const server = new Rect({
      left: 200,
      top: 50,
      fill: "transparent",
      stroke: activeColor,
      strokeWidth: 2,
      width: 100,
      height: 60,
    });
    canvas.add(server);
    
    canvas.add(new Textbox("Server", {
      left: 225,
      top: 70,
      fill: activeColor,
      fontSize: 14,
      fontFamily: "Inter, sans-serif",
    }));
    
    // Clients
    const clients = [
      { x: 50, y: 200, label: "Client 1" },
      { x: 200, y: 200, label: "Client 2" },
      { x: 350, y: 200, label: "Client 3" },
    ];
    
    clients.forEach(client => {
      const clientBox = new Rect({
        left: client.x,
        top: client.y,
        fill: "transparent",
        stroke: activeColor,
        strokeWidth: 2,
        width: 80,
        height: 50,
      });
      canvas.add(clientBox);
      
      canvas.add(new Textbox(client.label, {
        left: client.x + 10,
        top: client.y + 20,
        fill: activeColor,
        fontSize: 12,
        fontFamily: "Inter, sans-serif",
      }));
      
      // Connection line
      canvas.add(new Line([client.x + 40, client.y, 250, 110], {
        stroke: activeColor,
        strokeWidth: 2,
      }));
    });
    
    canvas.renderAll();
  };

  const createBasicDiagram = () => {
    if (!canvas) return;
    
    // Create a simple mind map
    const center = new Circle({
      left: 200,
      top: 150,
      fill: "transparent",
      stroke: activeColor,
      strokeWidth: 2,
      radius: 50,
    });
    canvas.add(center);
    
    canvas.add(new Textbox("Main Idea", {
      left: 170,
      top: 185,
      fill: activeColor,
      fontSize: 14,
      fontFamily: "Inter, sans-serif",
    }));
    
    const branches = [
      { x: 100, y: 50, label: "Branch 1" },
      { x: 350, y: 50, label: "Branch 2" },
      { x: 100, y: 250, label: "Branch 3" },
      { x: 350, y: 250, label: "Branch 4" },
    ];
    
    branches.forEach(branch => {
      // Branch circle
      const branchCircle = new Circle({
        left: branch.x,
        top: branch.y,
        fill: "transparent",
        stroke: activeColor,
        strokeWidth: 2,
        radius: 30,
      });
      canvas.add(branchCircle);
      
      canvas.add(new Textbox(branch.label, {
        left: branch.x - 20,
        top: branch.y + 20,
        fill: activeColor,
        fontSize: 12,
        fontFamily: "Inter, sans-serif",
      }));
      
      // Connection line
      canvas.add(new Line([250, 200, branch.x + 30, branch.y + 30], {
        stroke: activeColor,
        strokeWidth: 2,
      }));
    });
    
    canvas.renderAll();
  };

  return (
    <Card className="fixed right-4 bottom-4 w-96 p-6 shadow-2xl border border-primary/20 dark:border-primary/10 
      bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl backdrop-saturate-150 
      transition-all duration-300 animate-in slide-in-from-bottom
      hover:shadow-primary/5 dark:shadow-lg dark:shadow-primary/10
      rounded-xl overflow-hidden">
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent dark:from-primary/10" />
      
      {/* Content */}
      <div className="relative z-10">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Sparkles className="h-5 w-5 text-primary animate-pulse" />
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
            </div>
            <h3 className="text-lg font-semibold bg-gradient-to-r from-primary via-primary/80 to-primary/60 
              bg-clip-text text-transparent tracking-tight">
              AI Assistant
            </h3>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose} 
            className="h-7 w-7 rounded-full text-muted-foreground 
              hover:text-primary hover:bg-primary/10 hover:scale-105
              transition-all duration-200"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="relative group mb-5">
          <Textarea
            placeholder="Describe the diagram you want to create..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[120px] px-4 py-3 bg-background/50 dark:bg-gray-800/50 
              border-primary/20 dark:border-primary/10 rounded-xl resize-none transition-all duration-200
              placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary/20 
              focus:border-primary/30 dark:focus:border-primary/20 text-sm leading-relaxed
              group-hover:bg-background/70 dark:group-hover:bg-gray-800/70"
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 to-transparent 
            dark:from-primary/10 rounded-xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        
        <div className="relative">
          <Button 
            onClick={generateDiagram} 
            disabled={isGenerating || !prompt.trim()} 
            className={`w-full h-11 transition-all duration-300 transform rounded-xl
              ${isGenerating 
                ? 'bg-primary/80 cursor-wait' 
                : 'bg-gradient-to-r from-primary via-primary/90 to-primary/80 hover:scale-[1.02]'
              } text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-primary/30
              disabled:opacity-60 disabled:hover:scale-100 disabled:cursor-not-allowed`}
          >
            {isGenerating ? (
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 relative">
                  <div className="absolute inset-0 border-2 border-primary-foreground/30 border-t-primary-foreground 
                    rounded-full animate-spin" />
                  <div className="absolute inset-1 border border-primary-foreground/20 rounded-full animate-ping" />
                </div>
                <span className="animate-pulse">Generating your diagram...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 group">
                <Send className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                <span>Generate Diagram</span>
              </div>
            )}
          </Button>

          {/* Button shadow/glow effect */}
          <div className="absolute inset-0 -z-10 bg-primary/20 dark:bg-primary/30 rounded-xl blur-xl 
            opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {isGenerating && (
          <p className="mt-4 text-xs text-center text-muted-foreground/80 animate-pulse">
            Creating your visualization with AI magic ✨
          </p>
        )}
      </div>
    </Card>
  );
};
