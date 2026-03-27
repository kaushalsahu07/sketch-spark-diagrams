import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Gemini API client with the Vite env key (empty string if not set).
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");

export const generateGraphvizDiagram = async (prompt: string): Promise<string> => {
  if (!import.meta.env.VITE_GEMINI_API_KEY) {
    throw new Error("Gemini API key is not set. Please add VITE_GEMINI_API_KEY to your environment variables.");
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        },
      ],
      generationConfig: {
        temperature: 0.2,
        topP: 0.8,
        topK: 20,
        maxOutputTokens: 2000,
      },
    });

    const response = result.response;
    if (!response) {
      throw new Error("No response returned from Gemini");
    }

    // Use the SDK's text() helper — this is the standard way in @google/generative-ai
    const rawText = response.text();

    if (!rawText || rawText.trim() === "") {
      // Check for safety blocking
      const pf = response.promptFeedback;
      if (pf) {
        throw new Error(`Gemini blocked the response. Details: ${JSON.stringify(pf)}`);
      }
      throw new Error("Empty response from Gemini.");
    }

    // Return the raw text — let the caller handle parsing
    return rawText;
  } catch (err) {
    console.error("Error generating diagram:", err);
    throw err;
  }
};