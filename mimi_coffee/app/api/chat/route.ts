import { generateChatResponse, type ChatContext } from "@/lib/ai/prompts";
import { supabaseAdmin } from "@/lib/db/supabase";
import { apiResponse, apiError, checkRateLimit } from "@/lib/api-helpers";
import { chatSchema } from "@/lib/validations";
import type { ChatBody } from "@/types";
import { ZodError } from "zod";

async function buildChatContext(): Promise<ChatContext> {
  const { count: totalCustomers } = await supabaseAdmin
    .from("customers")
    .select("*", { count: "exact", head: true });

  const { data: topInterestsRaw } = await supabaseAdmin
    .from("customer_interests")
    .select(
      `
        interest_tags(
          name
        )
      `
    );

  const interestCounts: Record<string, number> = {};
  topInterestsRaw?.forEach((row: unknown) => {
    const tagName = (row as { interest_tags?: { name?: string } | null })?.interest_tags?.name;
    if (tagName) {
      interestCounts[tagName] = (interestCounts[tagName] || 0) + 1;
    }
  });

  const topInterests = Object.entries(interestCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const { data: latestCampaign } = await supabaseAdmin
    .from("campaigns")
    .select("batch_id")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let latestCampaigns: ChatContext["latestCampaigns"] = [];
  if (latestCampaign?.batch_id) {
    const { data: batchCampaigns } = await supabaseAdmin
      .from("campaigns")
      .select("theme, segment_description, why_now, time_window")
      .eq("batch_id", latestCampaign.batch_id)
      .order("created_at", { ascending: false })
      .limit(3);

    latestCampaigns = batchCampaigns || [];
  }

  return {
    totalCustomers: totalCustomers || 0,
    topInterests,
    latestCampaigns,
  };
}

export async function POST(request: Request) {
  const rateLimit = await checkRateLimit("chat", "ai");
  if (!rateLimit.allowed) return rateLimit.response;

  try {
    const body: ChatBody = await request.json();
    const validated = chatSchema.parse(body);

    const messages = validated.history || [];
    messages.push({ role: "user", content: validated.message });

    let context: ChatContext | undefined;
    try {
      context = await buildChatContext();
    } catch (contextError) {
      console.warn("Failed to load chat context, continuing without CRM context:", contextError);
    }

    const response = await generateChatResponse(messages, context);

    return apiResponse({ message: response });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return apiError(error.issues[0]?.message || "Invalid request body", 400);
    }
    console.error("Chat error:", error);
    return apiError("Failed to generate response");
  }
}
