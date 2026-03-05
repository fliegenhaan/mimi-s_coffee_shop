import type {
  ApiResponse,
  Campaign,
  ChatMessage,
  Customer,
  CustomerWithTags,
  DashboardData,
  GeneratedFromPeriod,
  InterestTag,
} from "@/types";

type CustomersListResponse = {
  customers: CustomerWithTags[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type LatestCampaignsResponse = {
  batch_id: string | null;
  campaigns: Campaign[];
};

type ChatResponse = {
  message: string;
};

async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(endpoint, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: "An error occurred",
    }));
    throw new Error(error.error || error.message || "Request failed");
  }

  const data: ApiResponse<T> = await response.json();

  if (!data.success) {
    throw new Error(data.error || "Request failed");
  }

  return data.data;
}

export const api = {
  getTags: () => fetchAPI<InterestTag[]>("/api/tags"),

  getCustomers: (params?: {
    search?: string;
    tags?: string;
    page?: number;
    limit?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set("search", params.search);
    if (params?.tags) searchParams.set("tags", params.tags);
    if (params?.page) searchParams.set("page", params.page.toString());
    if (params?.limit) searchParams.set("limit", params.limit.toString());

    const query = searchParams.toString();
    return fetchAPI<CustomersListResponse>(
      `/api/customers${query ? `?${query}` : ""}`
    );
  },

  createCustomer: (data: {
    name: string;
    contact?: string;
    favourite_product: string;
    tag_ids: string[];
  }) =>
    fetchAPI<Customer>("/api/customers", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateCustomer: (
    id: string,
    data: {
      name?: string;
      contact?: string;
      favourite_product?: string;
      tag_ids?: string[];
    }
  ) =>
    fetchAPI<Customer>(`/api/customers/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteCustomer: (id: string) =>
    fetchAPI<{ success: boolean }>(`/api/customers/${id}`, { method: "DELETE" }),

  getCampaigns: (limit?: number) =>
    fetchAPI<Campaign[]>(`/api/campaigns${limit ? `?limit=${limit}` : ""}`),

  getLatestCampaigns: () =>
    fetchAPI<LatestCampaignsResponse>("/api/campaigns/latest"),

  generateCampaign: (period: GeneratedFromPeriod) =>
    fetchAPI<Campaign[]>("/api/campaigns", {
      method: "POST",
      body: JSON.stringify({ period }),
    }),

  getDashboard: () => fetchAPI<DashboardData>("/api/dashboard"),

  sendChatMessage: (message: string, history?: ChatMessage[]) =>
    fetchAPI<ChatResponse>("/api/chat", {
      method: "POST",
      body: JSON.stringify({ message, history }),
    }),
};
