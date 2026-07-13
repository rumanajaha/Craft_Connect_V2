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
  const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
  const result = await model.embedContent(text);
  if (!result || !result.embedding || !result.embedding.values) {
    throw new Error("Failed to generate embedding");
  }
  return result.embedding.values;
}
