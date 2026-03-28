import { useState, useRef, FormEvent, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { X, Send, Sparkles, MessageSquare, Wand2 } from "lucide-react";
import * as fabric from "fabric";
import { Canvas as FabricCanvas } from "fabric";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { generateMistralResponse } from "@/lib/mistral";
import { generateChatResponse } from "@/lib/cohere";
import { useCallback, memo } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Drawer,
  DrawerContent,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

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

interface AIContentProps {
  onClose: () => void;
  mode: 'generate' | 'chat';
  setMode: (mode: 'generate' | 'chat') => void;
  canvas: FabricCanvas | null;
  activeColor: string;
  isGenerating: boolean;
  setIsGenerating: (isGenerating: boolean) => void;
}

const AIContent = ({
  onClose,
  mode,
  setMode,
  canvas,
  activeColor,
  isGenerating,
  setIsGenerating,
}: AIContentProps) => {
  // Separate states for CHAT and GENERATE modes
  const [generatePrompt, setGeneratePrompt] = useState("");
  const [chatPrompt, setChatPrompt] = useState("");
  const [generateMessages, setGenerateMessages] = useState<Message[]>([]);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);

  // Autofocus textarea ONLY after message is sent
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Only focus textarea AFTER a message is sent (i.e. when input is cleared)
    if (!isGenerating && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isGenerating]);

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

  // --- CHAT HANDLER ---
  const handleChat = async () => {
    if (!chatPrompt.trim()) return;
    const userMessage: Message = {
      role: 'user',
      content: chatPrompt,
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, userMessage]);
    setIsGenerating(true);

    try {
      const canvasDescription = getCanvasDescription();
      const response = await generateChatResponse(chatPrompt, canvasDescription);
      const aiMessage: Message = {
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, aiMessage]);
    } catch (error: any) {
      console.error("Chat error:", error);
      const errorMsg = error?.message || '';
      if (errorMsg.includes('API key')) {
        toast.error('⚠️ Chat API key is missing. Please add your Cohere API key in the .env file.');
        setChatMessages(prev => [...prev, { role: 'assistant', content: '❌ API key not configured. Please set VITE_COHERE_API_KEY in your .env file and restart the app.', timestamp: new Date() }]);
      } else if (errorMsg.includes('429') || errorMsg.includes('quota') || errorMsg.includes('rate')) {
        toast.error('⏳ Too many requests. Please wait a moment and try again.');
        setChatMessages(prev => [...prev, { role: 'assistant', content: '⏳ Rate limit reached. Please wait a few seconds before sending another message.', timestamp: new Date() }]);
      } else if (errorMsg.includes('network') || errorMsg.includes('fetch') || errorMsg.includes('Failed to fetch')) {
        toast.error('🌐 Network error. Please check your internet connection.');
        setChatMessages(prev => [...prev, { role: 'assistant', content: '🌐 Could not connect to the AI service. Please check your internet connection and try again.', timestamp: new Date() }]);
      } else {
        toast.error('💬 Failed to get a response. Please try again.');
        setChatMessages(prev => [...prev, { role: 'assistant', content: '❌ Something went wrong. Please try again or rephrase your question.', timestamp: new Date() }]);
      }
    } finally {
      setIsGenerating(false);
      setChatPrompt(""); // Only clear after chat completes
    }
  };

  // --- GENERATE HANDLER ---
  const addToCanvas = async (jsonData: any) => {
    if (!canvas) return;
    try {
      canvas.clear();
      if (!Array.isArray(jsonData.objects)) {
        toast.error('Invalid diagram JSON: objects should be an array');
        return;
      }
      const objects = jsonData.objects.map((obj: any) => {
        let fabricObj;
        switch (obj.type) {
          case 'rect': {
            const { type, ...rest } = obj;
            fabricObj = new fabric.Rect(rest);
            break;
          }
          case 'circle': {
            const { type, ...rest } = obj;
            fabricObj = new fabric.Circle(rest);
            break;
          }
          case 'text': {
            const { type, ...rest } = obj;
            // Ensure text is visible on dark canvas — override dark fills
            const textFill = obj.fill;
            const isDarkFill = !textFill || textFill === 'black' || textFill === '#000' || textFill === '#000000';
            fabricObj = new fabric.IText(obj.text, {
              ...rest,
              fill: isDarkFill ? 'white' : textFill,
              selectable: true,
              evented: true,
            });
            break;
          }
          case 'line': {
            const { type, x1, y1, x2, y2, ...rest } = obj;
            fabricObj = new fabric.Line([x1, y1, x2, y2], rest);
            break;
          }
          case 'path': {
            const { type, path, ...rest } = obj;
            fabricObj = new fabric.Path(path, rest);
            break;
          }
          default:
            console.warn(`Unsupported object type: ${obj.type}`);
            return null;
        }
        if (fabricObj) {
          if (obj.fill) fabricObj.set('fill', obj.fill);
          if (obj.stroke) fabricObj.set('stroke', obj.stroke);
          if (obj.strokeWidth) fabricObj.set('strokeWidth', obj.strokeWidth);
          if (obj.opacity !== undefined) fabricObj.set('opacity', obj.opacity);
        }
        return fabricObj;
      }).filter((obj): obj is fabric.Object => Boolean(obj));
      objects.forEach((obj: any) => {
        if (obj) {
          canvas.add(obj);
        }
      });

      // Center the diagram on the canvas
      if (objects.length > 0) {
        // Calculate bounding box of all objects
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        objects.forEach((obj) => {
          const bound = obj.getBoundingRect();
          minX = Math.min(minX, bound.left);
          minY = Math.min(minY, bound.top);
          maxX = Math.max(maxX, bound.left + bound.width);
          maxY = Math.max(maxY, bound.top + bound.height);
        });

        const diagramWidth = maxX - minX;
        const diagramHeight = maxY - minY;
        const canvasWidth = canvas.getWidth();
        const canvasHeight = canvas.getHeight();

        // Calculate offset to center
        const offsetX = (canvasWidth - diagramWidth) / 2 - minX;
        const offsetY = (canvasHeight - diagramHeight) / 2 - minY;

        // Shift all objects
        objects.forEach((obj) => {
          obj.set({
            left: (obj.left || 0) + offsetX,
            top: (obj.top || 0) + offsetY,
          });
          obj.setCoords();
        });
      }

      canvas.renderAll();
      const canvasJson = canvas.toJSON();
      localStorage.setItem('canvasData', JSON.stringify(canvasJson));

    } catch (error) {
      console.error('Error adding objects to canvas:', error);
      toast.error('⚠️ Could not render the diagram. The format may be unsupported — try a simpler prompt.');
    }
  };

  const handleGenerate = async () => {
    if (!generatePrompt.trim()) return;
    const userMessage: Message = {
      role: 'user',
      content: generatePrompt,
      timestamp: new Date()
    };
    setGenerateMessages(prev => [...prev, userMessage]);
    setIsGenerating(true);

    try {
      const canvasDescription = getCanvasDescription();
      const response = await generateMistralResponse(generatePrompt, canvasDescription);

      // Try to extract JSON from code fences (handles various whitespace patterns)
      const jsonMatch = response.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);

      let jsonData: any = null;
      let jsonSource = '';

      if (jsonMatch) {
        jsonSource = jsonMatch[1].trim();
      } else {
        // Fallback: try to find raw JSON object in the response
        const rawJsonMatch = response.match(/(\{[\s\S]*"objects"\s*:\s*\[[\s\S]*\][\s\S]*\})/);
        if (rawJsonMatch) {
          jsonSource = rawJsonMatch[1].trim();
        }
      }

      if (jsonSource) {
        try {
          jsonData = JSON.parse(jsonSource);
          await addToCanvas(jsonData);
          const objCount = jsonData.objects?.length || 0;
          toast.success(`✨ Diagram created with ${objCount} element${objCount !== 1 ? 's' : ''}!`);
          const cleanResponse = response
            .replace(/```(?:json)?[\s\S]*?```/, '')
            .replace(/\{[\s\S]*"objects"\s*:\s*\[[\s\S]*\][\s\S]*\}/, '')
            .trim();
          if (cleanResponse) {
            const aiMessage: Message = {
              role: 'assistant',
              content: cleanResponse,
              timestamp: new Date()
            };
            setGenerateMessages(prev => [...prev, aiMessage]);
          }
        } catch (parseError) {
          console.error('Error parsing diagram JSON:', parseError);
          toast.error('⚠️ The AI returned an invalid diagram. Please try again with a clearer description.');
          const aiMessage: Message = {
            role: 'assistant',
            content: '❌ I generated a response but it wasn\'t in the correct format. Could you try rephrasing your request? Simpler descriptions tend to work better.',
            timestamp: new Date()
          };
          setGenerateMessages(prev => [...prev, aiMessage]);
        }
      } else {
        const aiMessage: Message = {
          role: 'assistant',
          content: response.trim(),
          timestamp: new Date()
        };
        setGenerateMessages(prev => [...prev, aiMessage]);
        toast.warning('💡 No diagram was found in the response. Try describing the diagram more specifically.');
      }
    } catch (error: any) {
      console.error("Generate error:", error);
      const errorMsg = error?.message || '';
      let userToast = '';
      let chatMsg = '';

      if (errorMsg.includes('API key')) {
        userToast = '🔑 Gemini API key is missing. Please add it to your .env file.';
        chatMsg = '❌ API key not configured.\n\nPlease set VITE_GEMINI_API_KEY in your .env file and restart the dev server.';
      } else if (errorMsg.includes('429') || errorMsg.includes('quota') || errorMsg.includes('RESOURCE_EXHAUSTED')) {
        userToast = '⏳ API quota exceeded. Please wait or check your billing.';
        chatMsg = '⏳ You\'ve hit the API rate limit.\n\nPlease wait a minute before trying again, or upgrade your API plan at https://aistudio.google.com';
      } else if (errorMsg.includes('403') || errorMsg.includes('permission')) {
        userToast = '🔒 API access denied. Please check your API key permissions.';
        chatMsg = '🔒 Your API key doesn\'t have permission to use this model. Please check your key at https://aistudio.google.com/apikey';
      } else if (errorMsg.includes('network') || errorMsg.includes('fetch') || errorMsg.includes('Failed to fetch')) {
        userToast = '🌐 Network error. Check your internet connection.';
        chatMsg = '🌐 Could not connect to Google\'s AI service. Please check your internet connection and try again.';
      } else if (errorMsg.includes('Empty response')) {
        userToast = '🤔 AI returned an empty response. Try again.';
        chatMsg = '🤔 The AI didn\'t generate anything. Please try again with a different description.';
      } else {
        userToast = '❌ Failed to generate diagram. Please try again.';
        chatMsg = '❌ Something went wrong while generating the diagram. Please try again or use a simpler prompt.';
      }

      toast.error(userToast);
      const aiMessage: Message = {
        role: 'assistant',
        content: chatMsg,
        timestamp: new Date()
      };
      setGenerateMessages(prev => [...prev, aiMessage]);
    } finally {
      setIsGenerating(false);
      setGeneratePrompt("");
    }
  };

  // Handle form submit, only affect current mode's prompt/messages
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (mode === 'chat') {
      handleChat();
    } else if (mode === 'generate') {
      handleGenerate();
    }
  };

  return (
    <div className="relative z-10 h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 sm:mb-6 flex-shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative">
            <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary animate-pulse" />
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold bg-gradient-to-r from-primary via-primary/80 to-primary/60 
            bg-clip-text text-transparent tracking-tight">
            AI Assistant
          </h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-6 w-6 sm:h-7 sm:w-7 rounded-full text-muted-foreground 
            hover:text-primary hover:bg-primary/10 hover:scale-105
            transition-all duration-200"
        >
          <X className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-1 sm:gap-2 mb-3 sm:mb-4 p-1 bg-muted/30 rounded-lg flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMode('generate')}
          className={cn(
            "flex-1 gap-1 sm:gap-2 rounded-md transition-all text-xs sm:text-sm h-8 sm:h-9",
            mode === 'generate' && "bg-background shadow-sm"
          )}
        >
          <Wand2 className="h-3 w-3 sm:h-4 sm:w-4" />
          Generate
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMode('chat')}
          className={cn(
            "flex-1 gap-1 sm:gap-2 rounded-md transition-all text-xs sm:text-sm h-8 sm:h-9",
            mode === 'chat' && "bg-background shadow-sm"
          )}
        >
          <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4" />
          Chat
        </Button>
      </div>

      {/* Mode specific: messages and inputs */}
      {mode === 'chat' && chatMessages.length > 0 && (
        <ScrollArea className="flex-1 mb-3 sm:mb-4 pr-2 sm:pr-4 min-h-0">
          <div className="space-y-3 sm:space-y-4">
            {chatMessages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "flex flex-col max-w-[85%] rounded-lg p-2 sm:p-3",
                  message.role === 'user'
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "bg-muted/50 text-foreground"
                )}
              >
                <div className="text-xs sm:text-sm whitespace-pre-wrap">{message.content}</div>
                {message.diagram && (
                  <div
                    className="mt-1 sm:mt-2 p-1 sm:p-2 bg-background/50 rounded-md"
                    dangerouslySetInnerHTML={{ __html: message.diagram }}
                  />
                )}
                <span className="text-[9px] sm:text-[10px] opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
      {mode === 'generate' && generateMessages.length > 0 && (
        <ScrollArea className="flex-1 mb-3 sm:mb-4 pr-2 sm:pr-4 min-h-0">
          <div className="space-y-3 sm:space-y-4">
            {generateMessages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "flex flex-col max-w-[85%] rounded-lg p-2 sm:p-3",
                  message.role === 'user'
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "bg-muted/50 text-foreground"
                )}
              >
                <div className="text-xs sm:text-sm whitespace-pre-wrap">{message.content}</div>
                {message.diagram && (
                  <div
                    className="mt-1 sm:mt-2 p-1 sm:p-2 bg-background/50 rounded-md"
                    dangerouslySetInnerHTML={{ __html: message.diagram }}
                  />
                )}
                <span className="text-[9px] sm:text-[10px] opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Input form per mode */}
      {(mode === 'generate' || mode === 'chat') && (
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 flex-shrink-0">
          <div className="relative group">
            <Textarea
              ref={textareaRef}
              placeholder={mode === 'generate'
                ? "Describe the diagram you want to create..."
                : "Ask me anything! I can help with your canvas..."}
              value={mode === 'generate' ? generatePrompt : chatPrompt}
              onChange={(e) => mode === 'generate' ? setGeneratePrompt(e.target.value) : setChatPrompt(e.target.value)}
              className={cn(
                "px-3 sm:px-4 py-2 sm:py-3 bg-background/50 dark:bg-gray-800/50 border-primary/20 dark:border-primary/10",
                "rounded-xl resize-none transition-all duration-200",
                "placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary/20",
                "focus:border-primary/30 dark:focus:border-primary/20 text-xs sm:text-sm leading-relaxed",
                "group-hover:bg-background/70 dark:group-hover:bg-gray-800/70",
                mode === 'chat' ? 'min-h-[60px] sm:min-h-[80px]' : 'min-h-[80px] sm:min-h-[120px]'
              )}
            />
            <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 to-transparent 
              dark:from-primary/10 rounded-xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          <Button
            type="submit"
            disabled={isGenerating || !(mode === 'generate' ? generatePrompt.trim() : chatPrompt.trim())}
            className={`w-full h-9 sm:h-11 transition-all duration-300 transform rounded-xl text-xs sm:text-sm
              ${isGenerating
                ? 'bg-primary/80 cursor-wait'
                : 'bg-gradient-to-r from-primary via-primary/90 to-primary/80 hover:scale-[1.02]'
              } text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-primary/30
              disabled:opacity-60 disabled:hover:scale-100 disabled:cursor-not-allowed`}
          >
            {isGenerating ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-3 h-3 sm:w-5 sm:h-5 relative">
                  <div className="absolute inset-0 border-2 border-primary-foreground/30 border-t-primary-foreground 
                    rounded-full animate-spin" />
                  <div className="absolute inset-1 border border-primary-foreground/20 rounded-full animate-ping" />
                </div>
                <span className="animate-pulse">
                  {mode === 'generate' ? 'Generating...' : 'Thinking...'}
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-1 sm:gap-2 group">
                <Send className="h-3 w-3 sm:h-4 sm:w-4 transition-transform duration-300 group-hover:translate-x-1" />
                <span>{mode === 'generate' ? 'Generate Diagram' : 'Send Message'}</span>
              </div>
            )}
          </Button>
        </form>
      )}

      {isGenerating && (
        <p className="mt-2 sm:mt-4 text-[10px] sm:text-xs text-center text-muted-foreground/80 animate-pulse">
          {mode === 'generate'
            ? 'Creating your visualization with AI magic ✨'
            : 'Analyzing your canvas and crafting a response...'}
        </p>
      )}
    </div>
  );
};


export const AIAssistant = ({ canvas, onClose, activeColor }: AIAssistantProps) => {
  // Separate states for CHAT and GENERATE modes
  const [mode, setMode] = useState<'generate' | 'chat'>('generate');
  const [isGenerating, setIsGenerating] = useState(false);

  const contentProps: AIContentProps = {
    onClose,
    mode,
    setMode,
    canvas,
    activeColor,
    isGenerating,
    setIsGenerating,
  };

  // Mobile view using Drawer
  const isMobile = useIsMobile();
  if (isMobile) {
    return (
      <Drawer open={true} onOpenChange={onClose}>
        <DrawerContent className="h-[85vh] max-h-[85vh]">
          <div className="p-4 h-full overflow-hidden">
            {/* Background gradient effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent dark:from-primary/10" />
            <AIContent {...contentProps} />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop/Tablet view using Dialog for tablets and Card for desktop
  const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
  if (isTablet) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px] md:max-w-[600px] max-h-[80vh] p-4 sm:p-6">
          {/* Background gradient effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent dark:from-primary/10 rounded-lg" />
          <AIContent {...contentProps} />
        </DialogContent>
      </Dialog>
    );
  }

  // Desktop view
  return (
    <Card className="fixed right-4 bottom-4 w-96 h-[600px] p-6 shadow-2xl border border-primary/20 dark:border-primary/10 
      bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl backdrop-saturate-150 
      transition-all duration-300 animate-in slide-in-from-bottom
      hover:shadow-primary/5 dark:shadow-lg dark:shadow-primary/10
      rounded-xl overflow-hidden">
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent dark:from-primary/10" />
      <AIContent {...contentProps} />
    </Card>
  );
};
