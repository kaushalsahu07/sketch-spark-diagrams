import { CohereClient } from 'cohere-ai';

// Get API key from Vite environment variables
const apiKey = import.meta.env.VITE_COHERE_API_KEY;

if (!apiKey) {
  console.error('Cohere API key is missing. Please check your .env file.');
}

console.log('API Key available:', !!apiKey); // This will log true/false without exposing the key

// Initialize Cohere client
const cohere = new CohereClient({
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
    const response = await cohere.generate({
      model: 'command',
      prompt: `You are a helpful AI assistant named SketchSpark AI. You're knowledgeable about a wide range of topics and can help with both general questions and specific canvas-related inquiries.

      Canvas Context (if relevant): ${canvasDescription}
      
      User: ${prompt}

      Instructions:
      - If the question is about the canvas or drawing, use the canvas context to provide specific suggestions
      - If it's a general question, provide a helpful and informative response
      - Keep responses friendly and conversational
      - Be concise but thorough
      - If asked about technical topics, provide accurate information
      - If unsure about something, acknowledge it honestly
      
      Response:`,
      maxTokens: 300,
      temperature: 0.7,
      k: 0,
      stopSequences: [],
      returnLikelihoods: 'NONE'
    });

    if (!response.generations?.[0]?.text) {
      throw new Error('No response generated from Cohere API');
    }

    return response.generations[0].text.trim();
  } catch (error) {
    console.error('Error generating Cohere response:', error);
    throw new Error('Failed to generate response. Please try again.');
  }
};
