import { CohereClientV2 } from 'cohere-ai';

// Get API key from Vite environment variables
const apiKey = import.meta.env.VITE_COHERE_API_KEY;

if (!apiKey) {
  console.error('Cohere API key is missing. Please check your .env file.');
}

console.log('API Key available:', !!apiKey); // This will log true/false without exposing the key

// Initialize Cohere client
const cohere = new CohereClientV2({
  token: apiKey || '',
});

export const generateChatResponse = async (
  prompt: string,
  canvasDescription: string
): Promise<string> => {
  if (!apiKey) {
    throw new Error('Cohere API key is missing. Please check your environment variables.');
  }

  try {
    // Use the V2 Chat API instead of the removed Generate API
    const systemPreamble = `You are a helpful AI assistant named SketchSpark AI. You're knowledgeable about diagrams and canvas interactions, and should respond concisely and helpfully.`;

    const chatRequest = {
      model: 'command-a-03-2025',
      messages: [
        { role: 'system', content: systemPreamble },
        { role: 'user', content: `Canvas Context: ${canvasDescription}\n\nUser: ${prompt}` },
      ],
      temperature: 0.3,
      maxTokens: 300,
    } as any;

    const response = await cohere.chat(chatRequest);

    // The v2 chat response contains message.content as an array of content items
    const content = response?.message?.content;
    if (!content || !Array.isArray(content)) {
      console.error('Unexpected Cohere chat response shape:', response);
      throw new Error('No response generated from Cohere Chat API');
    }

    // Extract and join all text content parts
    const textParts = content
      .filter((c: any) => c?.text)
      .map((c: any) => c.text?.toString?.() || String(c.text));

    const finalText = textParts.join('\n').trim();
    if (!finalText) {
      throw new Error('Empty text returned from Cohere Chat API');
    }

    return finalText;
  } catch (error) {
    console.error('Error generating Cohere response:', error);
    // Re-throw more informative message for known Cohere errors
    if (error && (error as any).status === 404) {
      throw new Error('Cohere Generate API removed — migrated to Chat API. Please ensure the request is using the chat endpoint and a compatible model.');
    }
    throw new Error('Failed to generate response. Please try again.');
  }
};
