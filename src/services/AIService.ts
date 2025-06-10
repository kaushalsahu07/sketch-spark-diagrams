import { toast } from "sonner";

// Types for AI service responses
export interface AIResponse {
  text: string;
  type: 'text' | 'mermaid';
}

/**
 * Service for handling AI-related functionality using Mistral-7B-Instruct-v0.1
 * This is a simplified implementation that would need to be connected to a backend
 * service that actually runs the model, as running Mistral-7B directly in the browser
 * is not practical due to its size.
 */
export class AIService {
  private static API_ENDPOINT = "/api/mistral"; // This would point to your backend API

  /**
   * Generates a response from the Mistral-7B-Instruct-v0.1 model
   * @param prompt The user's prompt
   * @param generateMermaid Whether to generate Mermaid.js compatible output
   * @returns Promise with the AI response
   */
  static async generateResponse(prompt: string, generateMermaid: boolean = false): Promise<AIResponse> {
    try {
      // In a real implementation, this would make an API call to your backend
      // where the Mistral model is running
      
      // For now, we'll simulate a response with a timeout
      return new Promise((resolve) => {
        setTimeout(() => {
          if (generateMermaid) {
            resolve(this.simulateMermaidResponse(prompt));
          } else {
            resolve(this.simulateTextResponse(prompt));
          }
        }, 1000);
      });
    } catch (error) {
      console.error("Error generating AI response:", error);
      toast.error("Failed to generate AI response. Please try again.");
      throw error;
    }
  }

  /**
   * Summarizes canvas data from localStorage
   * @returns Promise with the summary as text
   */
  static async summarizeCanvasData(): Promise<AIResponse> {
    try {
      // Get canvas data from localStorage
      const canvasData = localStorage.getItem("canvasData");
      
      if (!canvasData) {
        return {
          text: "No canvas data found to summarize.",
          type: 'text'
        };
      }

      // Parse the canvas data
      const parsedData = JSON.parse(canvasData);
      
      // In a real implementation, this would send the data to the Mistral model
      // for summarization via an API call
      
      // For now, we'll simulate a response
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(this.simulateCanvasSummary(parsedData));
        }, 1000);
      });
    } catch (error) {
      console.error("Error summarizing canvas data:", error);
      toast.error("Failed to summarize canvas data. Please try again.");
      throw error;
    }
  }

  /**
   * Simulates a text response from the AI model
   * @param prompt The user's prompt
   * @returns Simulated AI response
   */
  private static simulateTextResponse(prompt: string): AIResponse {
    return {
      text: `I understand you're asking about "${prompt}". Here's my response based on your request.`,
      type: 'text'
    };
  }

  /**
   * Simulates a Mermaid.js diagram response from the AI model
   * @param prompt The user's prompt
   * @returns Simulated Mermaid diagram code
   */
  private static simulateMermaidResponse(prompt: string): AIResponse {
    // Generate a simple flowchart based on the prompt
    const lowerPrompt = prompt.toLowerCase();
    
    let mermaidCode = "";
    
    if (lowerPrompt.includes("flowchart") || lowerPrompt.includes("flow")) {
      mermaidCode = `flowchart TD\n  A[Start] --> B[Process]\n  B --> C{Decision}\n  C -->|Yes| D[Result 1]\n  C -->|No| E[Result 2]`;
    } else if (lowerPrompt.includes("sequence") || lowerPrompt.includes("sequence diagram")) {
      mermaidCode = `sequenceDiagram\n  participant User\n  participant System\n  User->>System: Request\n  System->>User: Response`;
    } else if (lowerPrompt.includes("class") || lowerPrompt.includes("class diagram")) {
      mermaidCode = `classDiagram\n  class Animal {\n    +name: string\n    +age: int\n    +makeSound()\n  }\n  class Dog {\n    +breed: string\n    +bark()\n  }\n  Animal <|-- Dog`;
    } else {
      // Default to a simple flowchart
      mermaidCode = `flowchart LR\n  A[Start] --> B[Process]\n  B --> C[End]`;
    }
    
    return {
      text: mermaidCode,
      type: 'mermaid'
    };
  }

  /**
   * Simulates a canvas summary based on the canvas data
   * @param canvasData The parsed canvas data from localStorage
   * @returns Simulated canvas summary
   */
  private static simulateCanvasSummary(canvasData: any): AIResponse {
    // Count the number of objects by type
    const objects = canvasData.objects || [];
    const objectTypes: Record<string, number> = {};
    
    objects.forEach((obj: any) => {
      const type = obj.type || 'unknown';
      objectTypes[type] = (objectTypes[type] || 0) + 1;
    });
    
    // Generate a summary text
    let summary = "Canvas Summary:\n\n";
    
    if (objects.length === 0) {
      summary += "The canvas is empty.";
    } else {
      summary += `The canvas contains ${objects.length} objects:\n`;
      
      for (const [type, count] of Object.entries(objectTypes)) {
        summary += `- ${count} ${type}${count !== 1 ? 's' : ''}\n`;
      }
      
      // Add canvas dimensions if available
      if (canvasData.width && canvasData.height) {
        summary += `\nCanvas dimensions: ${canvasData.width}×${canvasData.height}`;
      }
    }
    
    return {
      text: summary,
      type: 'text'
    };
  }
}