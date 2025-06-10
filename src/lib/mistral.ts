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

    console.log('Generating Graphviz diagram...');
    const diagramPrompt = `You are SketchSpark AI, a diagram expert. Create a diagram for this request. 

Context: ${canvasDescription}
Request: ${prompt}

Create a clear and organized diagram showing the relationships and flow.`;

    const result = await generateGraphvizDiagram(diagramPrompt);
    return result;
  } catch (error) {
    console.error('Error generating diagram:', error);
    if (error instanceof Error && error.message.includes('API key')) {
      throw error;
    }
    throw new Error('Failed to generate diagram. Please try again.');
  }
};

export const convertDotToSVG = async (dotCode: string): Promise<string> => {
  try {
    // Clean up the DOT code and remove the code block markers if present
    const cleanDotCode = dotCode
      .replace(/```dot\n/, '')
      .replace(/```$/, '')
      .trim();

    // Get initialized Viz.js instance
    const viz = await getViz();

    // Use Viz.js to render the DOT code to SVG
    const svg = await viz.renderString(cleanDotCode, {
      engine: 'dot',
      format: 'svg'
    });

    return svg;
  } catch (error) {
    console.error('Error converting DOT to SVG:', error);
    throw new Error('Failed to render diagram. Please check the Graphviz syntax.');
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

