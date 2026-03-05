"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AppLayout } from "../components/layout/app-layout";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../components/ui/collapsible";
import { Copy, Sparkles, ChevronDown, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import type { Campaign } from "@/types";

type Period = "all_time" | "7d" | "30d";

const periodOptions: { value: Period; label: string }[] = [
  { value: "all_time", label: "All Time" },
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
];

export default function CampaignsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [period, setPeriod] = useState<Period>("all_time");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [historyCampaigns, setHistoryCampaigns] = useState<Campaign[]>([]);
  const [generating, setGenerating] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
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
      const data = await api.getCampaigns(50);
      setCampaigns(data);

      const latest = await api.getLatestCampaigns();
      if ("campaigns" in latest) {
        setHistoryCampaigns(latest.campaigns || []);
      }
    } catch (error) {
      console.error("Failed to fetch campaigns:", error);
      toast.error("Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  };

  const copyPromo = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Promo copied!");
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const newCampaigns = await api.generateCampaign(period);
      setCampaigns(newCampaigns);

      toast.success("Campaign generated successfully!");

      await fetchData();
    } catch (error) {
      console.error("Failed to generate campaign:", error);
      toast.error("Failed to generate campaign");
    } finally {
      setGenerating(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <AppLayout title="Campaigns">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Campaigns">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex gap-1.5">
            {periodOptions.map((p) => (
              <Button
                key={p.value}
                variant={period === p.value ? "default" : "outline"}
                size="sm"
                onClick={() => setPeriod(p.value)}
              >
                {p.label}
              </Button>
            ))}
          </div>
          <Button onClick={handleGenerate} disabled={generating}>
            <Sparkles className="w-4 h-4 mr-1.5" />
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate Campaign"
            )}
          </Button>
        </div>

        <div className="space-y-4">
          {campaigns.length === 0 ? (
            <Card className="shadow-card">
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">
                  No campaigns yet. Generate your first campaign!
                </p>
              </CardContent>
            </Card>
          ) : (
            campaigns.map((c) => (
              <CampaignCard key={c.id} campaign={c} onCopy={copyPromo} />
            ))
          )}
        </div>
        
        {historyCampaigns.length > 0 && (
          <Collapsible open={historyOpen} onOpenChange={setHistoryOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="text-sm text-muted-foreground w-full justify-between hover:bg-accent hover:text-accent-foreground"
              >
                Campaign History ({historyCampaigns.length})
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    historyOpen ? "rotate-180" : ""
                  }`}
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-2">
              {historyCampaigns.map((c) => (
                <CampaignCard key={c.id} campaign={c} onCopy={copyPromo} />
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    </AppLayout>
  );
}

function CampaignCard({
  campaign,
  onCopy,
}: {
  campaign: Campaign;
  onCopy: (text: string) => void;
}) {
  return (
    <Card className="shadow-card">
      <CardContent className="pt-5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-semibold text-foreground font-sans">
            {campaign.theme}
          </h4>
          <div className="flex items-center gap-2 shrink-0">
            {campaign.time_window && (
              <Badge variant="secondary" className="text-xs">
                {campaign.time_window}
              </Badge>
            )}
          </div>
        </div>
        <p className="text-sm text-foreground/80">
          {campaign.segment_description}
        </p>
        <p className="text-xs text-muted-foreground italic">
          {campaign.why_now}
        </p>
        <div className="bg-secondary border border-border rounded-lg p-3">
          <p className="text-sm text-foreground leading-relaxed">
            {campaign.message}
          </p>
        </div>
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={() => onCopy(campaign.message)}
          >
            <Copy className="w-3 h-3 mr-1" /> Copy message
          </Button>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {new Date(campaign.created_at).toLocaleDateString()}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
