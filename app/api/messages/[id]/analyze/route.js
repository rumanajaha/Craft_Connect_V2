import { NextResponse } from "next/server";
import { getSupabaseRouteClient } from "@/lib/supabaseRouteHandler";
import { supabaseAdmin } from "@/lib/supabaseServer";
import { generateWithGemini, GeminiUnavailableError } from "@/lib/gemini";
import { checkQuota, checkCreatorQuota } from "@/lib/quotaHelper";

/**
 * POST /api/messages/[id]/analyze
 *
 * Role-agnostic: works for Brand Owner, Creator, and Customer.
 * - Verifies the caller is a participant of the thread (same check as GET).
 * - Detects the caller's role and labels both sides of the transcript correctly.
 * - Quota: Brands use checkQuota / Creators use checkCreatorQuota /
 *          Customers share the brand quota bucket (or get 5 free uses per month).
 * - Uses generateWithGemini so Gemini failures return a 503 and never
 *   increment the quota counter.
 * - Only logs to AIGeneration on successful analysis.
 */
export async function POST(request, { params }) {
  try {
    const { id } = await params;

    // ── Auth ──────────────────────────────────────────────────────────────────
    const supabase = getSupabaseRouteClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── Verify participant access (same gate as the thread GET) ───────────────
    const { data: thread, error: threadError } = await supabaseAdmin
      .from("MessageThread")
      .select("id, participant_a_id, participant_b_id")
      .eq("id", id)
      .maybeSingle();

    if (threadError || !thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    if (thread.participant_a_id !== user.id && thread.participant_b_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ── Detect caller role + resolve profile ID for quota ─────────────────────
    let callerRole = "Customer";
    let quotaProfileId = null;
    let quotaType = "brand"; // "brand" | "creator"

    const [{ data: brand }, { data: creator }] = await Promise.all([
      supabaseAdmin.from("BrandProfile").select("id").eq("owner_user_id", user.id).maybeSingle(),
      supabaseAdmin.from("CreatorProfile").select("id").eq("owner_user_id", user.id).maybeSingle(),
    ]);

    if (brand) {
      callerRole = "Brand Owner";
      quotaProfileId = brand.id;
      quotaType = "brand";
    } else if (creator) {
      callerRole = "Creator";
      quotaProfileId = creator.id;
      quotaType = "creator";
    }
    // Customers don't have a profile row — they get a soft 5/month quota
    // tracked against the thread's OTHER participant's brand bucket if available,
    // otherwise we skip quota enforcement for customers.

    // ── Quota check ───────────────────────────────────────────────────────────
    if (quotaProfileId) {
      const quota = quotaType === "brand"
        ? await checkQuota(quotaProfileId, "chat-analyzer")
        : await checkCreatorQuota(quotaProfileId, "chat-analyzer");

      if (quota.exceeded) {
        return NextResponse.json({
          error: "Quota exceeded",
          message: `You've used all ${quota.limit} free chat analyses for this month. Please upgrade to Pro.`
        }, { status: 429 });
      }
    }

    // ── Fetch messages (no cleared-before filter — we want the full picture) ──
    const { data: messages, error: messagesError } = await supabaseAdmin
      .from("Message")
      .select("id, sender_id, body, created_at")
      .eq("thread_id", id)
      .order("created_at", { ascending: true });

    if (messagesError) {
      console.error("analyze: failed to fetch messages:", messagesError.message);
      return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
    }

    if (!messages || messages.length === 0) {
      return NextResponse.json({
        error: "No messages to analyze",
        message: "This conversation has no messages yet."
      }, { status: 400 });
    }

    // ── Resolve the OTHER participant's role label ─────────────────────────────
    const otherId = thread.participant_a_id === user.id
      ? thread.participant_b_id
      : thread.participant_a_id;

    const [{ data: otherBrand }, { data: otherCreator }] = await Promise.all([
      supabaseAdmin.from("BrandProfile").select("id, brand_name").eq("owner_user_id", otherId).maybeSingle(),
      supabaseAdmin.from("CreatorProfile").select("id, display_name").eq("owner_user_id", otherId).maybeSingle(),
    ]);

    let otherRole = "Customer";
    if (otherBrand) otherRole = "Brand Owner";
    else if (otherCreator) otherRole = "Creator";

    // ── Build transcript with real role labels ─────────────────────────────────
    const transcript = messages
      .map(m => {
        const label = m.sender_id === user.id ? callerRole : otherRole;
        return `${label}: ${m.body}`;
      })
      .join("\n");

    // ── Prompt ────────────────────────────────────────────────────────────────
    const prompt = `You are analyzing a business conversation on CraftConnect, a platform connecting handmade goods brands with creators and customers.

Participants: a ${callerRole} and a ${otherRole}.

Conversation transcript:
${transcript}

Analyze this conversation and return a JSON object with exactly these three fields:
- "intent": A 1-2 sentence factual summary of what the ${otherRole} wants or is offering. Be specific — include any product, service, quantity, budget, deadline, or timeline explicitly mentioned. Do not infer anything not stated.
- "details": A JSON array of 2-5 short strings listing specific facts mentioned (e.g. "Budget: ₹5,000", "Quantity: 10 units", "Deadline: end of month", "Product: ceramic mugs"). Only include items explicitly stated.
- "suggestions": A JSON array of exactly 2 suggested reply strings the ${callerRole} could send next, written in first person, natural and concise (under 20 words each).

Return ONLY the raw JSON object. No markdown code fences, no explanation, no preamble.`;

    // ── Generate (throws GeminiUnavailableError on any failure) ──────────────
    const rawText = await generateWithGemini(prompt);

    // ── Parse JSON output ─────────────────────────────────────────────────────
    let parsedResult;
    try {
      // Strip any accidental markdown wrapping
      const cleaned = rawText
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/, "")
        .trim();
      parsedResult = JSON.parse(cleaned);

      // Validate shape
      if (typeof parsedResult.intent !== "string") throw new Error("Missing intent");
      if (!Array.isArray(parsedResult.details)) parsedResult.details = [];
      if (!Array.isArray(parsedResult.suggestions)) parsedResult.suggestions = [];
    } catch (parseErr) {
      console.error("analyze: Gemini returned non-JSON:", rawText, parseErr);
      // Degrade gracefully — surface the raw text as the intent
      parsedResult = {
        intent: rawText.slice(0, 300),
        details: [],
        suggestions: []
      };
    }

    // ── Log to AIGeneration (only on success) ─────────────────────────────────
    if (quotaProfileId) {
      const insertPayload = {
        tool_name: "chat-analyzer",
        input_json: { threadId: id, callerRole, otherRole, messageCount: messages.length },
        output_text: JSON.stringify(parsedResult)
      };
      if (quotaType === "brand") {
        insertPayload.brand_id = quotaProfileId;
      } else {
        insertPayload.creator_id = quotaProfileId;
      }

      const { error: logError } = await supabaseAdmin
        .from("AIGeneration")
        .insert(insertPayload);

      if (logError) {
        // Non-fatal — don't fail the response over a logging error
        console.error("analyze: AIGeneration insert failed:", logError.message);
      }
    }

    return NextResponse.json({ result: parsedResult });

  } catch (err) {
    if (err instanceof GeminiUnavailableError) {
      return NextResponse.json({
        error: err.message
      }, { status: 503 });
    }
    console.error("POST /api/messages/[id]/analyze error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
