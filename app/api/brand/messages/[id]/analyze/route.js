import { NextResponse } from "next/server";
import { getSupabaseRouteClient } from "@/lib/supabaseRouteHandler";
import { getGeminiModel } from "@/lib/gemini";
import { checkQuota } from "@/lib/quotaHelper";

export async function POST(request, { params }) {
  try {
    const { id } = params;

    const supabase = getSupabaseRouteClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch the thread and verify ownership
    const { data: thread, error: threadError } = await supabase
      .from("MessageThread")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (threadError || !thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    if (thread.participant_a_id !== user.id && thread.participant_b_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch the brand profile for quota limits checking
    const { data: brand } = await supabase
      .from("BrandProfile")
      .select("id")
      .eq("owner_user_id", user.id)
      .maybeSingle();

    if (!brand) {
      return NextResponse.json({ error: "Only Brand Owners can analyze threads" }, { status: 400 });
    }

    // Perform quota limits check
    const quota = await checkQuota(brand.id, "chat-analyzer");
    if (quota.exceeded) {
      return NextResponse.json({
        error: "Quota Exceeded",
        message: `You have used all ${quota.limit} free chat analyses for this month.`
      }, { status: 429 });
    }

    // Fetch all messages in this thread
    const { data: messages, error: messagesError } = await supabase
      .from("Message")
      .select("*")
      .eq("thread_id", id)
      .order("created_at", { ascending: true });

    if (messagesError || !messages || messages.length === 0) {
      return NextResponse.json({ error: "No messages to analyze" }, { status: 400 });
    }

    // Build the transcript
    const transcript = messages
      .map((m) => `${m.sender_id === user.id ? "Brand Owner" : "Participant"}: ${m.body}`)
      .join("\n");

    // 7. Invoke Gemini
    const model = getGeminiModel();
    const systemPrompt = `Analyze the following message exchange between a Brand Owner and a Customer/Creator.
Extract the structured details in JSON format containing:
- "intent": a concise summary of what the customer/creator wants/needs.
- "details": a list of key metrics/details mentioned (e.g. products, custom requests, quantities, budget, deadlines, channel).
- "suggestions": a list of 2 suggested reply options for the brand owner.

Return ONLY a valid JSON object matching this schema. Do not wrap it in markdown backticks, code blocks, or any other text.

Exchange Transcript:
${transcript}`;

    const result = await model.generateContent(systemPrompt);
    let outputText = result.response.text().trim();

    // Clean markdown code blocks if any
    if (outputText.startsWith("```json")) {
      outputText = outputText.replace(/^```json/, "").replace(/```$/, "").trim();
    } else if (outputText.startsWith("```")) {
      outputText = outputText.replace(/^```/, "").replace(/```$/, "").trim();
    }

    let parsedResult;
    try {
      parsedResult = JSON.parse(outputText);
    } catch (e) {
      console.error("Gemini failed to output valid JSON:", outputText, e);
      // Fallback response structure
      parsedResult = {
        intent: "Negotiation/discussion regarding custom commissions or product interest.",
        details: ["Discussed product line specs.", "General inquiry about rates and timeline."],
        suggestions: ["Acknowledge receipt and express enthusiasm.", "Politely request details on specs/rates."]
      };
    }

    // 8. Log the generation for quota tracking
    await supabaseAdmin
      .from("AIGeneration")
      .insert({
        brand_id: brand.id,
        tool_name: "chat-analyzer",
        input_json: { threadId: id },
        output_text: JSON.stringify(parsedResult)
      });

    return NextResponse.json({ result: parsedResult });
  } catch (err) {
    console.error("POST /api/brand/messages/[id]/analyze error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
