import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("Missing GEMINI_API_KEY environment variable.");
}

const genAI = new GoogleGenerativeAI(apiKey);

export function getGeminiModel() {
  return genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
}

export async function getGeminiEmbedding(text) {
  // gemini-embedding-001 produces 768-d vectors, same as text-embedding-004
  const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
  const result = await model.embedContent(text);
  if (!result || !result.embedding || !result.embedding.values) {
    throw new Error("Failed to generate embedding");
  }
  return result.embedding.values;
}

// Canonical alias used by creator matching and backfill
export const getEmbedding = getGeminiEmbedding;

/**
 * Wraps a Gemini generateContent call with graceful error handling.
 * - Returns the trimmed text on success.
 * - Throws a GeminiUnavailableError on any Gemini failure so the caller
 *   can return a user-friendly message WITHOUT counting the attempt against quota.
 */
export class GeminiUnavailableError extends Error {
  constructor(message = "AI generation is temporarily unavailable, please try again.") {
    super(message);
    this.name = "GeminiUnavailableError";
  }
}

export async function generateWithGemini(prompt) {
  try {
    const model = getGeminiModel();
    const genResult = await model.generateContent(prompt);
    const text = genResult.response.text().trim();
    if (!text) {
      throw new GeminiUnavailableError("AI returned an empty response, please try again.");
    }
    return text;
  } catch (err) {
    if (err instanceof GeminiUnavailableError) throw err;
    // Gemini SDK errors: rate limit (429), invalid key (400/403), network, etc.
    console.error("Gemini API error:", err?.message || err);
    throw new GeminiUnavailableError();
  }
}

