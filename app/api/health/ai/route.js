import { NextResponse } from "next/server";
import crypto from "crypto";
import {
  generateWithGemini,
  getGeminiEmbedding,
  getGeminiTextModelName,
  getGeminiEmbedModelName,
} from "@/lib/gemini";

function isValidSecret(provided, expected) {
  if (!provided || !expected) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function GET(request) {
  const expectedSecret = process.env.HEALTH_SECRET;
  if (!expectedSecret) {
    return NextResponse.json(
      { error: "HEALTH_SECRET is not configured" },
      { status: 503 }
    );
  }

  const providedSecret = request.headers.get("x-health-secret");
  if (!isValidSecret(providedSecret, expectedSecret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const textModel = getGeminiTextModelName();
  const embedModel = getGeminiEmbedModelName();

  let textOk = false;
  let embedOk = false;
  let embedDims = null;
  const errors = [];

  try {
    const text = await generateWithGemini('Reply with the single word "ok".');
    textOk = Boolean(text && text.length > 0);
  } catch (err) {
    const detail = err?.upstreamMessage
      ? `text (${err.upstreamStatus ?? "unknown"}): ${err.upstreamMessage}`
      : `text: ${err?.message || String(err)}`;
    errors.push(detail);
  }

  try {
    const vec = await getGeminiEmbedding("CraftConnect health check");
    embedOk = Array.isArray(vec) && vec.length > 0;
    embedDims = embedOk ? vec.length : null;
  } catch (err) {
    const status = err?.status ?? err?.statusCode ?? "unknown";
    errors.push(`embed (${status}): ${err?.message || String(err)}`);
  }

  const payload = {
    textOk,
    embedOk,
    textModel,
    embedModel,
    embedDims,
    error: errors.length > 0 ? errors.join(" | ") : null,
  };

  return NextResponse.json(payload, { status: textOk && embedOk ? 200 : 503 });
}

