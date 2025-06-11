import { generateGraphvizDiagram } from './graphviz';
import { instance } from '@viz-js/viz';

// Initialize Viz.js instance
let vizInstance: any = null;

// Initialize Viz.js lazily
const getViz = async () => {
  if (!vizInstance) {
    vizInstance = await instance();
  }
  return vizInstance;
};

export const generateMistralResponse = async (
  prompt: string,
  canvasDescription: string
): Promise<string> => {
  try {
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
      throw new Error('Gemini API key is not set. Please add VITE_GEMINI_API_KEY to your environment variables.');
    }

    // New system prompt for fabric.js JSON
    const diagramPrompt = `You are SketchSpark AI, a diagram expert. 
Create a diagram for this request as a JSON code block compatible with fabric.js. 
Only use these types: rect, circle, text, line, path. 
Each object must have reasonable left, top, width, height, and color values. 
Group related objects close together. 
Do not use unsupported types. 
Return ONLY the JSON code block.

Context: ${canvasDescription}
Request: ${prompt}

Example:
\`\`\`json
{
  "objects": [
    { "type": "rect", "left": 100, "top": 100, "width": 120, "height": 60, "fill": "white", "stroke": "black" },
    { "type": "text", "text": "User", "left": 160, "top": 130, "fontSize": 20, "fill": "black" }
  ]
}
\`\`\`

Return ONLY the JSON code block.`;

    // Use your existing model call, but with the new prompt
    const result = await generateGraphvizDiagram(diagramPrompt); // This should be renamed, but for now, just use it to send the prompt
    return result;
  } catch (error) {
    console.error('Error generating diagram:', error);
    if (error instanceof Error && error.message.includes('API key')) {
      throw error;
    }
    throw new Error('Failed to generate diagram. Please try again.');
  }
};

export const extractMermaidCode = (response: string): string | null => {
  // Handle different possible formats:
  // 1. ```mermaid\n...\n```
  // 2. ```mermaid ...\n```
  // 3. ~~~mermaid\n...\n~~~
  const patterns = [
    /```mermaid\s*\n([\s\S]*?)\n```/i,
    /```mermaid\s+([\s\S]*?)```/i,
    /~~~mermaid\s*\n([\s\S]*?)\n~~~/i
  ];

  for (const pattern of patterns) {
    const match = response.match(pattern);
    if (match && match[1]) {
      // Clean up the extracted code
      return match[1]
        .trim()
        .replace(/^\s*\n/gm, '') // Remove empty lines at start
        .replace(/\n\s*$/gm, ''); // Remove empty lines at end
    }
  }
  
  return null;
};
function generateWithTogether(diagramPrompt: string) {
  throw new Error('Function not implemented.');
}

