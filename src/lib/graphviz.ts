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

    // Use the prompt as-is (it may be for DOT or JSON)
    const chat = model.startChat({
      generationConfig: {
        temperature: 0.2,
        topP: 0.8,
        topK: 20,
        maxOutputTokens: 1000,
      },
    });

    // Send the prompt directly
    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    const text = response.text();
    
    if (!text) {
      throw new Error('No response generated from Gemini');
    }

    // Return the raw text (could be JSON or DOT)
    return text;

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
