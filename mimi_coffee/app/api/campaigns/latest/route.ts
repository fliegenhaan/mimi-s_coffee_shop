import { supabaseAdmin } from "@/lib/db/supabase";
import { requireAuth } from "@/lib/auth/require-auth";
import { apiResponse, apiError, checkRateLimit } from "@/lib/api-helpers";

export async function GET() {
  const { session, error: authError } = await requireAuth();
  if (authError) return authError;

  const rateLimit = await checkRateLimit("campaigns");
  if (!rateLimit.allowed) return rateLimit.response;

  try {
    const { data: latestCampaign, error: latestError } = await supabaseAdmin
      .from("campaigns")
      .select("batch_id")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestError) throw latestError;

    if (!latestCampaign) {
      return apiResponse({ batch_id: null, campaigns: [] });
    }

    const { data: campaigns, error: campaignsError } = await supabaseAdmin
      .from("campaigns")
      .select("*")
      .eq("batch_id", latestCampaign.batch_id)
      .order("created_at", { ascending: false });

    if (campaignsError) throw campaignsError;

    return apiResponse({
      batch_id: latestCampaign.batch_id,
      campaigns: campaigns || [],
    });
  } catch (error) {
    console.error("Failed to fetch latest campaigns:", error);
    return apiError("Failed to fetch latest campaigns");
  }
}
