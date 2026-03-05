import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || "",
});

export interface CampaignData {
  theme: string;
  segmentDescription: string;
  whyNow: string;
  message: string;
  timeWindow?: string;
}

export interface GenerateCampaignInput {
  customers: Array<{
    name: string;
    favouriteProduct: string;
    interests: string[];
  }>;
  period: "all_time" | "7d" | "30d";
}

export interface ChatContext {
  totalCustomers: number;
  topInterests: Array<{ name: string; count: number }>;
  latestCampaigns: Array<{
    theme: string;
    segment_description: string;
    why_now: string;
    time_window: string | null;
  }>;
}

type RankedCount = { name: string; count: number };

function getTopCounts(items: string[], limit: number): RankedCount[] {
  const counts = items.reduce((acc, item) => {
    const key = item.trim();
    if (!key) return acc;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function rankSummary(items: RankedCount[]): string {
  if (items.length === 0) return "No strong trend yet.";
  return items.map((i) => `${i.name} (${i.count})`).join(", ");
}

function sampleCustomers(customers: GenerateCampaignInput["customers"], limit = 5): string {
  return customers
    .slice(0, limit)
    .map(
      (c) =>
        `${c.name} -> favorite: ${c.favouriteProduct} -> interests: ${
          c.interests.length ? c.interests.join(", ") : "none"
        }`
    )
    .join("\n");
}

function safeString(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

function safeCampaign(value: unknown): CampaignData | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;

  const theme = safeString(item.theme);
  const segmentDescription = safeString(item.segmentDescription);
  const whyNow = safeString(item.whyNow);
  const message = safeString(item.message);
  const timeWindow = safeString(item.timeWindow);

  if (!theme || !segmentDescription || !whyNow || !message) return null;

  return {
    theme,
    segmentDescription,
    whyNow,
    message,
    timeWindow: timeWindow || undefined,
  };
}

function extractJsonText(rawText: string): string {
  const trimmed = rawText.trim();
  if (!trimmed) throw new Error("AI returned empty text");

  const codeFenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (codeFenceMatch?.[1]) return codeFenceMatch[1].trim();

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("AI did not return a JSON object");
  }

  return trimmed.slice(start, end + 1);
}

function buildTemplateCampaigns(
  topInterests: RankedCount[],
  topProducts: RankedCount[],
  period: "all_time" | "7d" | "30d"
): CampaignData[] {
  const firstInterest = topInterests[0]?.name || "specialty coffee";
  const secondInterest = topInterests[1]?.name || "seasonal drinks";
  const firstProduct = topProducts[0]?.name || "signature drinks";
  const secondProduct = topProducts[1]?.name || "fresh pastry";

  const windowByPeriod =
    period === "7d"
      ? "This week"
      : period === "30d"
        ? "This month"
        : "This weekend";

  return [
    {
      theme: `${firstInterest} Focus Week`,
      segmentDescription: `Customers who often choose ${firstInterest} and ${firstProduct}.`,
      whyNow: `${firstInterest} is a leading interest in the selected period.`,
      message: `Try our ${firstProduct} picks built for ${firstInterest} fans. Reply now and we will reserve your cup for this week.`,
      timeWindow: windowByPeriod,
    },
    {
      theme: `${secondProduct} Pairing Moment`,
      segmentDescription: `Regulars who like ${secondProduct} with ${secondInterest}.`,
      whyNow: `${secondInterest} remains one of the strongest customer trends.`,
      message: `Enjoy a simple ${secondProduct} pairing made for your favorite flavor profile. Send us a message today to claim this week's offer.`,
      timeWindow: windowByPeriod,
    },
    {
      theme: "Community Favorites Rotation",
      segmentDescription: `Mixed segment of repeat buyers across top drink and pastry interests.`,
      whyNow: "The customer base is spread across multiple strong preferences, so a mixed promo is timely.",
      message: "We are rotating crowd favorites picked from recent customer preferences. Reply today and we will suggest the best option for your taste.",
      timeWindow: windowByPeriod,
    },
  ];
}

export async function generatePromoCampaign(input: GenerateCampaignInput): Promise<CampaignData[]> {
  const { customers, period } = input;

  const topInterests = getTopCounts(
    customers.flatMap((customer) => customer.interests),
    8
  );
  const topProducts = getTopCounts(
    customers.map((customer) => customer.favouriteProduct),
    5
  );

  const periodText = {
    all_time: "all customer data",
    "7d": "last 7 days",
    "30d": "last 30 days",
  }[period];

  const systemPrompt = `You are a very creative marketing strategist and copywriter for Kopi Kita Coffee Shop.
Generate practical, data-driven campaign ideas from CRM trends.
Return valid JSON only with no markdown, no prose, and no code fences.`;

  const customerSamples = sampleCustomers(customers);

  const userPrompt = `Generate 2 to 3 campaign ideas for this week using the CRM analytics summary below.

Data period: ${periodText}
Total customers analyzed: ${customers.length}
Top interests with counts: ${rankSummary(topInterests)}
Top products with counts: ${rankSummary(topProducts)}
Sample customer insights:
${customerSamples || "No sample customers available"}

Rules:
- Output 2 or 3 campaigns.
- theme: 4-10 words.
- segmentDescription: exactly 1 sentence, specific target segment.
- whyNow: exactly 1 short sentence that references trend/count context.
- message: 1-2 friendly sentences with a clear CTA for WhatsApp/SMS/DM.
- timeWindow: short phrase (for example: "This weekend", "Weekday mornings 7-11", "Until Sunday").
- Avoid generic corporate language.
- Do not invent data that contradicts the input trends.
- Be as persuasive as you can as a promotor for the product.
- Use emoji to boost emotional message.

Return JSON in this exact shape:
{
  "campaigns": [
    {
      "theme": "string",
      "segmentDescription": "string",
      "whyNow": "string",
      "message": "string",
      "timeWindow": "string"
    }
  ]
}`;

  try {
    const { text: generatedText } = await generateText({
      model: google("gemini-2.5-flash"),
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.7,
    });

    const reviewPrompt = `
You are reviewing marketing campaign ideas generated for a coffee shop.

Improve the campaigns if needed so they are:
- persuasive
- realistic for a coffee shop
- clearly based on the CRM trends
- concise and friendly

Do NOT change the JSON structure.

Return the improved JSON only.

Campaign JSON:
${generatedText}
`;

    let finalText = generatedText;
    try {
      const { text: improvedText } = await generateText({
        model: google("gemini-2.5-flash"),
        prompt: reviewPrompt,
        temperature: 0.3,
      });
      finalText = improvedText;
    } catch (reviewError) {
      console.warn("AI review failed, using original generation:", reviewError);
    }

    const jsonText = extractJsonText(finalText);
    const parsed = JSON.parse(jsonText) as { campaigns?: unknown[] };
    const campaigns = (parsed.campaigns || []).map(safeCampaign).filter(Boolean) as CampaignData[];

    if (campaigns.length < 2 && finalText !== generatedText) {
      const fallbackJsonText = extractJsonText(generatedText);
      const fallbackParsed = JSON.parse(fallbackJsonText) as { campaigns?: unknown[] };
      const fallbackCampaigns = (fallbackParsed.campaigns || [])
        .map(safeCampaign)
        .filter(Boolean) as CampaignData[];

      if (fallbackCampaigns.length >= 2) {
        return fallbackCampaigns.slice(0, 3);
      }
    }

    if (campaigns.length < 2) {
      throw new Error("AI response does not contain at least 2 valid campaigns");
    }

    return campaigns.slice(0, 3);
  } catch (aiError) {
    console.warn("AI generation failed, using template fallback:", aiError);
    return buildTemplateCampaigns(topInterests, topProducts, period).slice(0, 3);
  }
}

export async function generateChatResponse(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  context?: ChatContext
): Promise<string> {
  const contextSummary = context
    ? [
        `Total customers: ${context.totalCustomers}`,
        `Top interests: ${context.topInterests.map((x) => `${x.name} (${x.count})`).join(", ") || "No data"}`,
        `Latest campaigns: ${
          context.latestCampaigns
            .map((c) => `${c.theme} | ${c.segment_description} | ${c.why_now}`)
            .join(" || ") || "No campaign history"
        }`,
      ].join("\n")
    : "CRM context not available";

  const systemPrompt = `You are the CRM assistant for Kopi Kita Coffee Shop.
Use provided CRM context for questions about customers, segments, trends, or campaigns.
If the user asks for CRM metrics that are not in context, say the data is not available and suggest checking dashboard/campaign pages.
Do not fabricate numbers.
For coffee shop general questions (hours, menu, wifi), answer directly.
Keep replies concise (1-3 sentences), helpful, and friendly.

Static shop info:
- Hours: Monday-Friday 7am-8pm, Saturday-Sunday 8am-9pm
- Location: neighborhood coffee shop, cozy for work/study
- WiFi: free WiFi available
- Menu: espresso drinks, specialty lattes, cold brew, seasonal drinks, pastries

CRM context:
${contextSummary}`;

  try {
    const { text } = await generateText({
      model: google("gemini-2.5-flash"),
      system: systemPrompt,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      temperature: 0.65,
    });

    return text.trim();
  } catch (aiError) {
    console.warn("AI chat failed, using keyword fallback:", aiError);

    const lastMessage = messages[messages.length - 1]?.content || "";
    const lowerMessage = lastMessage.toLowerCase();

    if (lowerMessage.includes("hour") || lowerMessage.includes("open")) {
      return "We are open Monday-Friday 7am-8pm and Saturday-Sunday 8am-9pm.";
    }

    if (lowerMessage.includes("menu") || lowerMessage.includes("drink")) {
      return "Our menu includes espresso drinks, specialty lattes, cold brew, seasonal drinks, and pastries.";
    }

    if (lowerMessage.includes("location") || lowerMessage.includes("where")) {
      return "Kopi Kita is a cozy neighborhood coffee shop, easy for quick visits or longer work sessions.";
    }

    if (lowerMessage.includes("wifi") || lowerMessage.includes("work")) {
      return "Yes, we provide free WiFi and comfortable seating for work or study.";
    }

    if (lowerMessage.includes("campaign") || lowerMessage.includes("customer")) {
      return "I cannot load live CRM data right now. Please check the Dashboard or Campaigns page for the latest numbers.";
    }

    return "I can help with customer insights, campaign ideas, and coffee shop information. What do you want to check first?";
  }
}
