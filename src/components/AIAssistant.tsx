
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-96 p-6 bg-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-semibold">AI Diagram Assistant</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Describe the diagram you want to create:
            </label>
            <Textarea
              placeholder="e.g., 'Create a UML class diagram for a user management system' or 'Draw a flowchart for a login process'"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          
          <div className="text-xs text-gray-500">
            <p>Try keywords like: flowchart, UML, process, network, workflow</p>
          </div>
          
          <Button 
            onClick={generateDiagram}
            disabled={!prompt.trim() || isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              "Generating..."
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Generate Diagram
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
};
