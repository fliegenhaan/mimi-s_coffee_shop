export type InterestTag = {
  id: string;
  name: string;
};

export type Customer = {
  id: string;
  name: string;
  contact: string | null;
  favourite_product: string;
  created_at: string;
};

export type CustomerInterest = {
  id: string;
  customer_id: string;
  interest_tag_id: string;
};

export type Campaign = {
  id: string;
  batch_id: string;
  theme: string;
  segment_description: string;
  why_now: string;
  message: string;
  time_window: string | null;
  generated_from_period: GeneratedFromPeriod;
  created_at: string;
  is_active: boolean;
};

export type CustomerWithTags = Customer & {
  tags: InterestTag[];
};

export type CampaignBatch = {
  batch_id: string;
  generated_from_period: GeneratedFromPeriod;
  created_at: string;
  campaigns: Campaign[];
};

export type GeneratedFromPeriod = "all_time" | "7d" | "30d";

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export type GetCustomersQuery = {
  search?: string;
  tags?: string;
  page?: number;
  limit?: number;
};

export type CreateCustomerBody = {
  name: string;
  contact?: string;
  favourite_product: string;
  tag_ids: string[];
};

export type UpdateCustomerBody = Partial<CreateCustomerBody>;

export type GenerateCampaignBody = {
  period: GeneratedFromPeriod;
};

export type DashboardData = {
  total_customers: number;
  top_interests: { name: string; count: number }[];
  latest_campaign: CampaignBatch | null;
};

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ChatBody = {
  message: string;
  history?: ChatMessage[];
};

export type AiPromoTheme = {
  theme: string;
  segment_description: string;
  why_now: string;
  message: string;
  time_window?: string;
};

export type AiPromoResponse = {
  themes: AiPromoTheme[];
};

export type TagFilterState = {
  selectedTagIds: string[];
};