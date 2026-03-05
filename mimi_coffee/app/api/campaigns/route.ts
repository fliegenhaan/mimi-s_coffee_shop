import { supabaseAdmin } from "@/lib/db/supabase";
import { requireAuth } from "@/lib/auth/require-auth";
import { apiResponse, apiError, checkRateLimit } from "@/lib/api-helpers";
import { generateCampaignSchema } from "@/lib/validations";
import { generatePromoCampaign } from "@/lib/ai/prompts";
import type { GenerateCampaignBody } from "@/types";
import { ZodError } from "zod";

export async function GET(request: Request) {
  const { error: authError } = await requireAuth();
  if (authError) return authError;

  const rateLimit = await checkRateLimit("campaigns");
  if (!rateLimit.allowed) return rateLimit.response;

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");

    const { data, error } = await supabaseAdmin
      .from("campaigns")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return apiResponse(data || []);
  } catch (error) {
    console.error("Failed to fetch campaigns:", error);
    return apiError("Failed to fetch campaigns");
  }
}

export async function POST(request: Request) {
  const { error: authError } = await requireAuth();
  if (authError) return authError;

  const rateLimit = await checkRateLimit("campaigns-generate", "ai");
  if (!rateLimit.allowed) return rateLimit.response;

  try {
    const body: GenerateCampaignBody = await request.json();
    const validated = generateCampaignSchema.parse(body);

    const { data: customers, error: fetchError } = await supabaseAdmin
      .from("customers")
      .select(`
        name,
        favourite_product,
        customer_interests(
          interest_tags(name)
        )
      `)
      .order("created_at", { ascending: false });

    if (fetchError) throw fetchError;

    const customerData = (customers || []).map((c: unknown) => {
      const row = c as {
        name: string;
        favourite_product: string;
        customer_interests?: Array<{ interest_tags?: { name?: string } | null }> | null;
      };

      return {
        name: row.name,
        favouriteProduct: row.favourite_product,
        interests:
          row.customer_interests
            ?.map((ci) => ci.interest_tags?.name)
            .filter((name): name is string => Boolean(name)) || [],
      };
    });

    const campaignIdeas = await generatePromoCampaign({
      customers: customerData,
      period: validated.period,
    });

    const batchId = crypto.randomUUID();

    const rowsToInsert = campaignIdeas.map((campaignData) => ({
      batch_id: batchId,
      theme: campaignData.theme,
      segment_description: campaignData.segmentDescription,
      why_now: campaignData.whyNow,
      message: campaignData.message,
      time_window: campaignData.timeWindow || null,
      generated_from_period: validated.period,
    }));

    const { data: campaigns, error: insertError } = await supabaseAdmin
      .from("campaigns")
      .insert(rowsToInsert)
      .select();

    if (insertError) throw insertError;

    const orderedCampaigns = [...(campaigns || [])].sort((a, b) =>
      (b.created_at || "").localeCompare(a.created_at || "")
    );

    return apiResponse(orderedCampaigns, 201);
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return apiError(error.issues[0]?.message || "Invalid request body", 400);
    }
    console.error("Campaign generation error:", error);
    return apiError("Failed to generate campaign");
  }
}
