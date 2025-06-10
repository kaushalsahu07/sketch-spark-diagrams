import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

// Helper function to check if DOT syntax is valid
const validateDotSyntax = (dotCode: string): boolean => {
  // Basic validation - check for digraph declaration and valid connections
  const hasValidSyntax = dotCode.includes('->') || dotCode.includes('--');
  const hasValidDirective = dotCode.includes('digraph') || dotCode.includes('graph');

  return hasValidSyntax && hasValidDirective;
};

export const generateGraphvizDiagram = async (prompt: string): Promise<string> => {
  try {
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
      throw new Error('Gemini API key is not set. Please add VITE_GEMINI_API_KEY to your environment variables.');
    }

    const model = genAI.getGenerativeModel({ 
      model: 'gemma-3-27b-it',
    });

    // Enhanced system prompt for Graphviz DOT diagram generation
    const systemPrompt = `You are a Graphviz (DOT) diagram expert. Create clear and valid DOT diagrams following these rules:

1. Always use directed graphs (digraph)
2. Use descriptive node labels in quotes
3. Use proper DOT arrow syntax: ->
4. Add styling when relevant
5. Keep the diagram focused and readable

Example of a valid DOT diagram:
\`\`\`dot
digraph G {
  // Set default styles
  node [shape=box, style=rounded];
  edge [color=navy];
  
  // Define nodes with labels
  start [label="Start"];
  process [label="Process Data"];
  decision [label="Make Decision", shape=diamond];
  success [label="Success", color=green];
  failure [label="Failure", color=red];
  
  // Define relationships
  start -> process;
  process -> decision;
  decision -> success [label="Yes"];
  decision -> failure [label="No"];
}
\`\`\`

Note: Focus on clarity and readability. Use appropriate node shapes and edge styles.`;

    const chat = model.startChat({
      generationConfig: {
        temperature: 0.2,
        topP: 0.8,
        topK: 20,
        maxOutputTokens: 1000,
      },
    });

    // Send the context first
    await chat.sendMessage(systemPrompt);
    
    // Generate the diagram based on the prompt
    const diagramPrompt = `Create a clear Graphviz DOT diagram for this request: ${prompt}

Requirements:
- Use digraph for directed relationships
- Add descriptive labels in quotes
- Use appropriate node shapes
- Add colors for better understanding
- Keep it under 15 nodes for clarity
- Return only the DOT code block`;

    const result = await chat.sendMessage(diagramPrompt);
    const response = await result.response;
    const text = response.text();
    
    if (!text) {
      throw new Error('No response generated from Gemini');
    }

    // Extract the DOT code block
    const dotMatch = text.match(/```dot\n([\s\S]*?)```/);
    if (!dotMatch) {
      console.error('Raw response:', text);
      throw new Error('No valid DOT diagram found in response');
    }

    const dotCode = dotMatch[1].trim();
    
    // Validate the generated DOT code
    if (!validateDotSyntax(dotCode)) {
      throw new Error('Generated DOT code appears to be invalid');
    }

    // Return the full code block
    return `\`\`\`dot\n${dotCode}\n\`\`\``;

  } catch (error) {
    console.error('Error generating with Graphviz:', error);
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        throw error;
      }
      if (error.message.includes('No valid DOT diagram found')) {
        throw new Error('Failed to generate a valid diagram. Please try again with a simpler request.');
      }
      if (error.message.includes('invalid')) {
        throw new Error('The generated diagram has syntax errors. Please try a different prompt.');
      }
    }
    throw new Error('Failed to generate diagram. Please try again.');
  }
};
