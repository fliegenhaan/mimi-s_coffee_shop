import { supabaseAdmin } from "@/lib/db/supabase";
import { requireAuth } from "@/lib/auth/require-auth";
import { apiResponse, apiError, checkRateLimit } from "@/lib/api-helpers";
import {
  createCustomerSchema,
  getCustomersQuerySchema,
} from "@/lib/validations";
import type { CustomerWithTags, CreateCustomerBody } from "@/types";

export async function GET(request: Request) {
  const { session, error: authError } = await requireAuth();
  if (authError) return authError;

  const rateLimit = await checkRateLimit("customers");
  if (!rateLimit.allowed) return rateLimit.response;

  try {
    const { searchParams } = new URL(request.url);
    const query = getCustomersQuerySchema.parse({
      search: searchParams.get("search") || undefined,
      tags: searchParams.get("tags") || undefined,
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "20",
    });

    let queryBuilder = supabaseAdmin
      .from("customers")
      .select(
        `
        *,
        customer_interests(
          interest_tags(*)
        )
      `,
        { count: "exact" }
      );

    if (query.search) {
      queryBuilder = queryBuilder.ilike("name", `%${query.search}%`);
    }

    const from = (query.page - 1) * query.limit;
    const to = from + query.limit - 1;

    const { data, error, count } = await queryBuilder
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw error;

    const customers: CustomerWithTags[] = (data || []).map(
      (customer: any) => ({
        id: customer.id,
        name: customer.name,
        contact: customer.contact,
        favourite_product: customer.favourite_product,
        created_at: customer.created_at,
        tags:
          customer.customer_interests
            ?.map((ci: any) => ci.interest_tags)
            .filter(Boolean) || [],
      })
    );

    let filteredCustomers = customers;
    if (query.tags) {
      const tagIds = query.tags.split(",");
      filteredCustomers = customers.filter((customer) =>
        customer.tags.some((tag) => tagIds.includes(tag.id))
      );
    }

    return apiResponse({
      customers: filteredCustomers,
      pagination: {
        page: query.page,
        limit: query.limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / query.limit),
      },
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return apiError("Invalid query parameters", 400);
    }
    console.error("Failed to fetch customers:", error);
    return apiError("Failed to fetch customers");
  }
}

export async function POST(request: Request) {
  const { session, error: authError } = await requireAuth();
  if (authError) return authError;

  const rateLimit = await checkRateLimit("customers");
  if (!rateLimit.allowed) return rateLimit.response;

  try {
    const body: CreateCustomerBody = await request.json();

    const validated = createCustomerSchema.parse(body);

    const { data: customer, error: customerError } = await supabaseAdmin
      .from("customers")
      .insert({
        name: validated.name,
        contact: validated.contact || null,
        favourite_product: validated.favourite_product,
      })
      .select()
      .single();

    if (customerError) throw customerError;
    
    if (validated.tag_ids && validated.tag_ids.length > 0) {
      const interests = validated.tag_ids.map((tagId) => ({
        customer_id: customer.id,
        interest_tag_id: tagId,
      }));

      const { error: interestsError } = await supabaseAdmin
        .from("customer_interests")
        .insert(interests);

      if (interestsError) throw interestsError;
    }

    return apiResponse(customer, 201);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return apiError(error.errors[0].message, 400);
    }
    console.error("Failed to create customer:", error);
    return apiError("Failed to create customer");
  }
}
