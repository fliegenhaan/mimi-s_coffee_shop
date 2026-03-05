import { supabaseAdmin } from "@/lib/db/supabase";
import { requireAuth } from "@/lib/auth/require-auth";
import { apiResponse, apiError, checkRateLimit } from "@/lib/api-helpers";
import type { DashboardData } from "@/types";

export async function GET() {
  const { session, error: authError } = await requireAuth();
  if (authError) return authError;

  const rateLimit = await checkRateLimit("dashboard");
  if (!rateLimit.allowed) return rateLimit.response;

  try {
    const { count: totalCustomers } = await supabaseAdmin
      .from("customers")
      .select("*", { count: "exact", head: true });
    
    const { data: topInterestsRaw } = await supabaseAdmin
      .from("customer_interests")
      .select(`
        interest_tags(
          name
        )
      `);
    
    const interestCounts: Record<string, number> = {};
    topInterestsRaw?.forEach((ci: any) => {
      const name = ci.interest_tags?.name;
      if (name) {
        interestCounts[name] = (interestCounts[name] || 0) + 1;
      }
    });

    const topInterests = Object.entries(interestCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    const { data: latestCampaignRaw } = await supabaseAdmin
      .from("campaigns")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let latestCampaign = null;
    if (latestCampaignRaw) {
      const { data: batchCampaigns } = await supabaseAdmin
        .from("campaigns")
        .select("*")
        .eq("batch_id", latestCampaignRaw.batch_id)
        .order("created_at", { ascending: false });

      latestCampaign = {
        batch_id: latestCampaignRaw.batch_id,
        generated_from_period: latestCampaignRaw.generated_from_period,
        created_at: latestCampaignRaw.created_at,
        campaigns: batchCampaigns || [],
      };
    }

    const dashboardData: DashboardData = {
      total_customers: totalCustomers || 0,
      top_interests: topInterests,
      latest_campaign: latestCampaign,
    };

    return apiResponse(dashboardData);
  } catch (error) {
    console.error("Dashboard error:", error);
    return apiError("Failed to fetch dashboard data");
  }
}
