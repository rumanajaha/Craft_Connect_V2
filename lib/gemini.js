import { GoogleGenerativeAI } from "@google/generative-ai";

const DEFAULT_TEXT_MODEL = "gemini-3.5-flash-lite";
const DEFAULT_EMBED_MODEL = "gemini-embedding-001";

export function getGeminiTextModelName() {
  return process.env.GEMINI_TEXT_MODEL || DEFAULT_TEXT_MODEL;
}

export function getGeminiEmbedModelName() {
  return process.env.GEMINI_EMBED_MODEL || DEFAULT_EMBED_MODEL;
}

export const GEMINI_TEXT_MODEL = getGeminiTextModelName();
export const GEMINI_EMBED_MODEL = getGeminiEmbedModelName();

let cachedClient = null;
let cachedApiKey = null;

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY environment variable.");
  }
  if (!cachedClient || cachedApiKey !== apiKey) {
    cachedClient = new GoogleGenerativeAI(apiKey);
    cachedApiKey = apiKey;
  }
  return cachedClient;
}

function extractUpstreamError(err) {
  const status =
    err?.status ??
    err?.statusCode ??
    err?.response?.status ??
    err?.cause?.status ??
    "unknown";
  const message = err?.message || String(err);
  return { status, message };
}

/**
 * Wraps Gemini errors with a user-friendly message while preserving
 * upstream diagnostics for server-side logging and health checks.
 * Callers return HTTP 503 WITHOUT counting the failed attempt against quota.
 */
export class GeminiUnavailableError extends Error {
  constructor(
    message = "AI generation is temporarily unavailable, please try again.",
    { status = null, upstreamMessage = null } = {}
  ) {
    super(message);
    this.name = "GeminiUnavailableError";
    this.status = 503;
    this.upstreamStatus = status;
    this.upstreamMessage = upstreamMessage;
  }
}

export async function generateWithGemini(prompt) {
  const modelName = getGeminiTextModelName();
  try {
    const model = getClient().getGenerativeModel({ model: modelName });
    const genResult = await model.generateContent(prompt);
    const text = genResult.response.text().trim();
    if (!text) {
      console.error(
        `Gemini text generation error (model=${modelName}, status=200): Empty response body`
      );
      throw new GeminiUnavailableError(
        "AI returned an empty response, please try again.",
        { status: 200, upstreamMessage: "Empty response body" }
      );
    }
    return text;
  } catch (err) {
    if (err instanceof GeminiUnavailableError) throw err;
    const { status, message } = extractUpstreamError(err);
    console.error(
      `Gemini text generation error (model=${modelName}, status=${status}): ${message}`
    );
    throw new GeminiUnavailableError(
      "AI generation is temporarily unavailable, please try again.",
      { status, upstreamMessage: message }
    );
  }
}

export async function getGeminiEmbedding(text) {
  const modelName = getGeminiEmbedModelName();
  try {
    const model = getClient().getGenerativeModel({ model: modelName });
    const result = await model.embedContent(text);
    const values = result?.embedding?.values;
    if (!values || !Array.isArray(values) || values.length === 0) {
      throw new Error("Failed to generate embedding: empty vector returned");
    }
    return values;
  } catch (err) {
    const { status, message } = extractUpstreamError(err);
    console.error(
      `Gemini embedding error (model=${modelName}, status=${status}): ${message}`
    );
    throw err;
  }
}

// Canonical alias used by creator matching and backfill
export const getEmbedding = getGeminiEmbedding;
