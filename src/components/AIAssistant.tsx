import { useState, useEffect, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { X, Send, Sparkles, MessageSquare, Wand2 } from "lucide-react";
import { Canvas as FabricCanvas } from "fabric";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { generateMistralResponse, convertDotToSVG } from "@/lib/mistral";
import { generateChatResponse } from "@/lib/cohere";

interface AIAssistantProps {
  canvas: FabricCanvas | null;
  onClose: () => void;
  activeColor: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  diagram?: string;
}

export const AIAssistant = ({ canvas, onClose, activeColor }: AIAssistantProps) => {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [mode, setMode] = useState<'generate' | 'chat'>('generate');
  const [messages, setMessages] = useState<Message[]>([]);

  const getCanvasDescription = () => {
    if (!canvas) return "Empty canvas";
    
    const objects = canvas.getObjects();
    const objectTypes = objects.map(obj => obj.type);
    const objectCounts = objectTypes.reduce((acc, type) => {
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return `Canvas contains: ${Object.entries(objectCounts)
      .map(([type, count]) => `${count} ${type}${count > 1 ? 's' : ''}`)
      .join(', ')}`;
  };

  const handleChat = async () => {
    if (!prompt.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: prompt,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setIsGenerating(true);

    try {
      const canvasDescription = getCanvasDescription();
      const response = await generateChatResponse(prompt, canvasDescription);
      const aiMessage: Message = {
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      toast.error("Failed to generate response. Please try again.");
    } finally {
      setIsGenerating(false);
      setPrompt("");
    }
  };

  const addSVGToCanvas = async (svgString: string) => {
    if (!canvas) return;
  
    try {
      fabric.loadSVGFromString(svgString, (objects, options) => {
        const group = new fabric.Group(objects, {
          left: canvas.width! / 2,
          top: canvas.height! / 2,
          scaleX: 0.5,
          scaleY: 0.5,
        });
        
        canvas.add(group);
        canvas.centerObject(group);
        canvas.renderAll();
        
        // Save to localStorage
        const jsonData = canvas.toJSON();
        localStorage.setItem('canvasData', JSON.stringify(jsonData));
      });
    } catch (error) {
      console.error('Error adding SVG to canvas:', error);
      toast.error('Failed to add diagram to canvas');
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: prompt,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setIsGenerating(true);

    try {
      console.log("Generating diagram for prompt:", prompt);
      const canvasDescription = getCanvasDescription();
      
      // Generate response with diagram
      const response = await generateMistralResponse(prompt, canvasDescription);
      console.log("Mistral response:", response);
  
      // Extract DOT code if present
      const dotCode = response.match(/```dot\n([\s\S]*?)```/);
      console.log("Extracted DOT code:", dotCode);
  
      let diagram: string | undefined;
      if (dotCode) {
        try {
          console.log("Converting DOT to SVG");
          diagram = await convertDotToSVG(dotCode[1]);
          console.log("SVG generated successfully");
          
          // Add SVG to canvas
          if (diagram) {
            await addSVGToCanvas(diagram);
            toast.success('Diagram added to canvas!');
          }
        } catch (error) {
          console.error('Error converting diagram:', error);
          toast.error("Failed to render diagram, but providing text response.");
        }
      }
  
      // Clean response text
      const cleanResponse = dotCode 
        ? response.replace(/\`\`\`dot[\s\S]*?\`\`\`/, '').trim()
        : response;
  
      const aiMessage: Message = {
        role: 'assistant',
        content: cleanResponse,
        timestamp: new Date(),
        diagram
      };
      setMessages(prev => [...prev, aiMessage]);
      
      if (!dotCode) {
        toast.warning("No diagram generated. Try being more specific about the diagram you want.");
      } else if (diagram) {
        toast.success("Diagram generated successfully!");
      }
    } catch (error: any) {
      console.error("Generate error:", error);
      if (error.message?.includes('API key is not set')) {
        toast.error("API key not configured. Please check your environment setup.");
      } else if (error.message?.includes('Failed to render diagram')) {
        toast.error("Failed to create diagram. Please try a different diagram type.");
      } else {
        toast.error("Failed to generate diagram. Please try again.");
      }
    } finally {
      setIsGenerating(false);
      setPrompt("");
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (mode === 'chat') {
      handleChat();
    } else if (mode === 'generate') {
      handleGenerate();
    }
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

        {/* Mode Toggle */}
        <div className="flex gap-2 mb-4 p-1 bg-muted/30 rounded-lg">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMode('generate')}
            className={cn(
              "flex-1 gap-2 rounded-md transition-all",
              mode === 'generate' && "bg-background shadow-sm"
            )}
          >
            <Wand2 className="h-4 w-4" />
            Generate
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMode('chat')}
            className={cn(
              "flex-1 gap-2 rounded-md transition-all",
              mode === 'chat' && "bg-background shadow-sm"
            )}
          >
            <MessageSquare className="h-4 w-4" />
            Chat
          </Button>
        </div>

        {/* Chat Messages */}
        {mode === 'chat' && messages.length > 0 && (
          <ScrollArea className="h-[300px] mb-4 pr-4">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex flex-col max-w-[85%] rounded-lg p-3",
                    message.role === 'user' 
                      ? "ml-auto bg-primary text-primary-foreground"
                      : "bg-muted/50 text-foreground"
                  )}
                >
                  <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                  {message.diagram && (
                    <div 
                      className="mt-2 p-2 bg-background/50 rounded-md"
                      dangerouslySetInnerHTML={{ __html: message.diagram }}
                    />
                  )}
                  <span className="text-[10px] opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
        
        {/* Input form - only show for generate and chat modes */}
        {(mode === 'generate' || mode === 'chat') && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative group">
              <Textarea
                placeholder={mode === 'generate' 
                  ? "Describe the diagram you want to create..., Example: Create a flowchart showing the process of making coffee"
                  : "Ask me anything! I can help with your canvas or any other questions..."}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className={cn(
                  "px-4 py-3 bg-background/50 dark:bg-gray-800/50 border-primary/20 dark:border-primary/10",
                  "rounded-xl resize-none transition-all duration-200",
                  "placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary/20",
                  "focus:border-primary/30 dark:focus:border-primary/20 text-sm leading-relaxed",
                  "group-hover:bg-background/70 dark:group-hover:bg-gray-800/70",
                  mode === 'chat' ? 'min-h-[80px]' : 'min-h-[120px]'
                )}
              />
              <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 to-transparent 
                dark:from-primary/10 rounded-xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            
            <Button 
              type="submit"
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
                  <span className="animate-pulse">
                    {mode === 'generate' ? 'Generating...' : 'Thinking...'}
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 group">
                  <Send className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  <span>{mode === 'generate' ? 'Generate Diagram' : 'Send Message'}</span>
                </div>
              )}
            </Button>
          </form>
        )}

        {isGenerating && (
          <p className="mt-4 text-xs text-center text-muted-foreground/80 animate-pulse">
            {mode === 'generate' 
              ? 'Creating your visualization with AI magic ✨'
              : 'Analyzing your canvas and crafting a response...'}
          </p>
        )}
      </div>
    </Card>
  );
};
