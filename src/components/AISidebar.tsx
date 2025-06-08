
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Bot, Send, Sparkles } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import * as fabric from "fabric";

interface AISidebarProps {
  canvas: fabric.Canvas | null;
  activeColor: string;
}

export const AISidebar = ({ canvas, activeColor }: AISidebarProps) => {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { theme } = useTheme();

  const handleAIGenerate = async () => {
    if (!prompt.trim() || !canvas) return;
    
    setIsLoading(true);
    // Simulate AI processing
    setTimeout(() => {
      console.log("AI generating:", prompt);
      setIsLoading(false);
      setPrompt("");
    }, 2000);
  };

  return (
    <Card className="w-full bg-background/95 backdrop-blur border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Bot className="w-5 h-5" />
          AI Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Describe what you want to create:
          </label>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Draw a house with a tree, create a flowchart..."
            className="min-h-[100px] bg-background border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>
        
        <Button 
          onClick={handleAIGenerate}
          disabled={!prompt.trim() || isLoading}
          className="w-full"
        >
          {isLoading ? (
            <Sparkles className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Send className="w-4 h-4 mr-2" />
          )}
          {isLoading ? "Generating..." : "Generate"}
        </Button>

        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Quick actions:
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setPrompt("Create a simple flowchart")}
              className="text-xs"
            >
              Flowchart
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setPrompt("Draw a mind map")}
              className="text-xs"
            >
              Mind Map
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setPrompt("Create a diagram")}
              className="text-xs"
            >
              Diagram
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setPrompt("Design a layout")}
              className="text-xs"
            >
              Layout
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
