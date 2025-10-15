import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Gemini API client with the Vite env key (empty string if not set).
// Note: Do not expose a production API key in client-side code. Prefer server-side.
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");

// Helper function to check if DOT syntax is valid (very small heuristic)
const validateDotSyntax = (dotCode: string): boolean => {
  const hasValidSyntax = dotCode.includes("->") || dotCode.includes("--");
  const hasValidDirective = dotCode.includes("digraph") || dotCode.includes("graph");
  return hasValidSyntax && hasValidDirective;
};

// Extract code block content if the model returned a fenced block (``` or ~~~)
const extractFencedCode = (text: string): string | null => {
  const fencePattern = /(?:```|~~~)\s*(?:[a-zA-Z0-9+\-_.]*)?\n([\s\S]*?)\n(?:```|~~~)/i;
  const m = text.match(fencePattern);
  if (m && m[1]) return m[1].trim();
  return null;
};

// Try to clean and normalize the model response into either DOT or JSON string
const cleanModelResponse = (raw: string): string => {
  // Prefer content inside code fences
  const fenced = extractFencedCode(raw);
  const candidate = (fenced || raw).trim();

  // If it looks like JSON, try to parse/pretty-print it
  if (/^\{[\s\S]*\}$/.test(candidate) || /^\[/.test(candidate)) {
    try {
      const parsed = JSON.parse(candidate);
      return JSON.stringify(parsed, null, 2);
    } catch (e) {
      // Not valid JSON; return raw candidate and let caller handle it
      return candidate;
    }
  }

  // If it looks like DOT, validate minimally
  if (validateDotSyntax(candidate)) {
    return candidate;
  }

  // Fallback: return trimmed raw
  return candidate;
};

export const generateGraphvizDiagram = async (prompt: string): Promise<string> => {
  if (!import.meta.env.VITE_GEMINI_API_KEY) {
    throw new Error("Gemini API key is not set. Please add VITE_GEMINI_API_KEY to your environment variables.");
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Build a generateContent request according to the SDK types.
    const request = {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        topP: 0.8,
        topK: 20,
        maxOutputTokens: 1000,
      },
    } as any; // SDK types are available in package; keep as any to avoid tight coupling here

    const result = await model.generateContent(request);

    const enhanced = result.response;
    if (!enhanced) {
      throw new Error("No response returned from Gemini");
    }

    // If the SDK helper is available, prefer it
    let rawText = "";
    try {
      if (typeof (enhanced as any).text === "function") {
        rawText = (enhanced as any).text() || "";
      }
    } catch (e) {
      // ignore and try fallbacks below
      console.warn("enhanced.text() threw, falling back to candidate parsing", e);
    }

    // Fallback: inspect candidates -> content -> parts for text fields
    if (!rawText || rawText.trim() === "") {
      const candidates = (result as any)?.response?.candidates;
      if (Array.isArray(candidates) && candidates.length > 0) {
        const texts: string[] = [];
        for (const cand of candidates) {
          // candidate.content may be an object with parts
          const content = cand.content || cand;
          // If content has parts array
          if (Array.isArray(content?.parts)) {
            for (const part of content.parts) {
              if (part?.text) texts.push(part.text);
              // nested inlineData or other shapes might have string fields
              else if (typeof part === 'string') texts.push(part);
            }
          }
          // If candidate itself has text
          if (cand?.text) texts.push(cand.text);
        }
        rawText = texts.join('\n').trim();
      }
    }

    // Try additional response shape patterns if still empty
    if (!rawText || rawText.trim() === "") {
      // Try direct response text
      if (typeof enhanced.text === 'string') {
        rawText = enhanced.text;
      }
      // Try response.text property
      else if (typeof (result as any)?.text === 'string') {
        rawText = (result as any).text;
      }
      // Try first candidate's direct text
      else if ((result as any)?.candidates?.[0]?.text) {
        rawText = (result as any).candidates[0].text;
      }
      // Try response segments if available
      else if (Array.isArray((result as any)?.segments)) {
        rawText = (result as any).segments
          .map((seg: any) => seg.text || '')
          .filter(Boolean)
          .join('\n');
      }
    }

    // Check for promptFeedback / safety blocking info
    if (!rawText || rawText.trim() === "") {
      const pf = (result as any)?.response?.promptFeedback || 
                (result as any)?.response?.prompt_feedback ||
                (result as any)?.promptFeedback;
      if (pf) {
        console.warn('Gemini promptFeedback detected:', pf);
        throw new Error(`Gemini blocked the prompt or the response was filtered by safety settings. Details: ${JSON.stringify(pf)}`);
      }
    }

    // Last resort with detailed error and diagnostics
    if (!rawText || rawText.trim() === "") {
      console.error('Gemini response structure:', {
        hasResponse: !!enhanced,
        responseType: typeof enhanced,
        hasText: typeof (enhanced as any).text,
        hasSegments: Array.isArray((result as any)?.segments),
        hasCandidates: Array.isArray((result as any)?.candidates),
        rawResult: JSON.stringify(result)
      });
      throw new Error('Empty response from Gemini. The response structure was unexpected - please check the console for details.');
    }

    return cleanModelResponse(rawText);
  } catch (err) {
    console.error("Error generating Graphviz diagram:", err);
    if (err instanceof Error && err.message.includes("API key")) {
      throw err;
    }
    // Surface useful message for common failure modes
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("quota") || msg.includes("403") || msg.includes("permission")) {
      throw new Error("Gemini API permission or quota error. Check your API key and quotas.");
    }
    throw new Error("Failed to generate diagram. The AI response may be malformed — try a simpler prompt or check your API key.");
  }
};