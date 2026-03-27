import { generateGraphvizDiagram } from './graphviz';

export const generateMistralResponse = async (
  prompt: string,
  canvasDescription: string
): Promise<string> => {
  try {
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
      throw new Error('Gemini API key is not set. Please add VITE_GEMINI_API_KEY to your environment variables.');
    }

    const diagramPrompt = `You are SketchSpark AI, a diagram and layout expert trained to generate structured visuals using Fabric.js-compatible JSON. Your output must render an accurate, well-aligned diagram using only supported object types: rect, circle, text, line, and path.

**Instructions:**
- Group related objects close together and ensure logical visual structure (e.g., label next to shapes, lines connecting related parts).
- For all shapes (e.g., rect, circle), include visually reasonable \`left\`, \`top\`, \`width\`, \`height\`, and \`fill\` values.
- All text should be clearly readable, positioned appropriately near or within relevant shapes, with reasonable \`fontSize\`, \`left\`, and \`top\` values.
- Use \`line\` objects to show connections or flow where appropriate. Ensure they start and end near the related shapes.
- Use \`path\` only if a specific non-linear or curved visual element is required.
- All colors must be clear and visually distinct. Default to \`"white"\` fill with \`"black"\` stroke for shapes unless otherwise meaningful.
- Maintain alignment and consistent spacing to produce a clean, easy-to-read diagram.

**Canvas Context:** ${canvasDescription}

**Diagram Request:** ${prompt}

**Format Example (return only JSON inside a code block):**
\`\`\`json
{
  "objects": [
    { "type": "rect", "left": 100, "top": 100, "width": 120, "height": 60, "fill": "white", "stroke": "black", "strokeWidth": 2 },
    { "type": "text", "text": "User", "left": 125, "top": 120, "fontSize": 20, "fill": "black" },
    { "type": "line", "x1": 160, "y1": 160, "x2": 160, "y2": 200, "stroke": "black", "strokeWidth": 2 }
  ]
}
\`\`\`

**Important:** 
Return ONLY the JSON code block. Do not include explanations, introductions, or extra formatting.
`;

    const result = await generateGraphvizDiagram(diagramPrompt);

    // Wrap the result in a code fence if it's raw JSON without one,
    // so the caller can consistently parse ```json ... ``` blocks
    if (result.trim().startsWith('{') && !result.includes('```')) {
      return '```json\n' + result.trim() + '\n```';
    }

    return result;
  } catch (error) {
    console.error('Error generating diagram:', error);
    if (error instanceof Error && error.message.includes('API key')) {
      throw error;
    }
    throw error;
  }
};
