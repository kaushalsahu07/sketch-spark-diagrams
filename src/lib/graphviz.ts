import { GoogleGenAI } from "@google/genai";

// Initialize the Gemini API client with the Vite env key.
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || "" });

export const generateGraphvizDiagram = async (prompt: string): Promise<string> => {
  if (!import.meta.env.VITE_GEMINI_API_KEY) {
    throw new Error("Gemini API key is not set. Please add VITE_GEMINI_API_KEY to your environment variables.");
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        temperature: 0.2,
        topP: 0.8,
        topK: 20,
        maxOutputTokens: 8192,
      },
    });

    const rawText = response.text;

    if (!rawText || rawText.trim() === "") {
      throw new Error("Empty response from Gemini.");
    }

    // Return the raw text — let the caller handle parsing
    return rawText;
  } catch (err) {
    console.error("Error generating diagram:", err);
    throw err;
  }
};