import { supabaseAdmin } from "@/lib/db/supabase";
import { apiResponse, apiError, checkRateLimit } from "@/lib/api-helpers";
import type { InterestTag } from "@/types";

export async function GET() {
  const rateLimit = await checkRateLimit("tags");
  if (!rateLimit.allowed) return rateLimit.response;

  try {
    const { data, error } = await supabaseAdmin
      .from("interest_tags")
      .select("*")
      .order("name");

    if (error) throw error;

    return apiResponse<InterestTag[]>(data || []);
  } catch (error) {
    console.error("Failed to fetch tags:", error);
    return apiError("Failed to fetch tags");
  }
}
