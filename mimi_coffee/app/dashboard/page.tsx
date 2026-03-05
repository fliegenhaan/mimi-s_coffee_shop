"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AppLayout } from "../components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Users, TrendingUp, Megaphone, Copy } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import type { DashboardData, Campaign } from "@/types";

export default function DashboardPage() {
  const { status } = useSession();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchData();
    }
  }, [status, router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [data, latestCampaigns] = await Promise.all([
        api.getDashboard(),
        api.getLatestCampaigns(),
      ]);

      setDashboardData(data as DashboardData);
      if ("campaigns" in (latestCampaigns as Record<string, unknown>)) {
        setCampaigns((latestCampaigns as { campaigns: Campaign[] }).campaigns);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const copyPromo = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Promo message copied!");
  };

  if (status === "loading" || loading) {
    return (
      <AppLayout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </AppLayout>
    );
  }

  const topInterests = dashboardData?.top_interests || [];
  const chartData = topInterests.slice(0, 6).map((item) => ({
    name: item.name,
    count: item.count,
  }));

  return (
    <AppLayout title="Dashboard">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">
                    Total Customers
                  </p>
                  <p className="text-3xl font-bold text-foreground mt-1">
                    {dashboardData?.total_customers || 0}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">
                    Top Interest This Month
                  </p>
                  <p className="text-3xl font-bold text-foreground mt-1">
                    {topInterests[0]?.name || "N/A"}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">
                    Active Campaign Batch
                  </p>
                  <p className="text-3xl font-bold text-foreground mt-1">
                    {campaigns.length || 0}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                  <Megaphone className="w-5 h-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold font-sans">
              Top Interests
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ left: 20 }}
                >
                  <XAxis
                    type="number"
                    tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 13, fill: "var(--color-foreground)" }}
                    axisLine={false}
                    tickLine={false}
                    width={80}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid var(--color-border)",
                      backgroundColor: "var(--color-card)",
                      color: "var(--color-foreground)",
                      fontSize: "13px",
                    }}
                  />
                  <Bar
                    dataKey="count"
                    fill="var(--color-primary)"
                    radius={[0, 6, 6, 0]}
                    barSize={18}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-sm text-muted-foreground py-8">
                No interest data available
              </div>
            )}
          </CardContent>
        </Card>
        
        {campaigns.length > 0 && (
          <div>
            <h3 className="text-base font-semibold font-sans text-foreground mb-4">
              Latest Campaigns
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {campaigns.map((campaign) => (
                <Card key={campaign.id} className="shadow-card">
                  <CardContent className="pt-5 space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h4 className="min-w-0 flex-1 font-semibold text-foreground text-sm font-sans break-words">
                        {campaign.theme}
                      </h4>
                      {campaign.time_window && (
                        <Badge
                          variant="secondary"
                          className="max-w-full text-left text-xs break-words whitespace-normal"
                        >
                          {campaign.time_window}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-foreground/80 break-words">
                      {campaign.segment_description}
                    </p>
                    <p className="text-xs text-muted-foreground italic break-words">
                      {campaign.why_now}
                    </p>
                    <div className="bg-secondary border border-border rounded-lg p-3">
                      <p className="text-sm text-foreground leading-relaxed break-words">
                        {campaign.message}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => copyPromo(campaign.message)}
                    >
                      <Copy className="w-3 h-3 mr-1" /> Copy message
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
