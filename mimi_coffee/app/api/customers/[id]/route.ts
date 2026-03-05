import { supabaseAdmin } from "@/lib/db/supabase";
import { requireAuth } from "@/lib/auth/require-auth";
import { apiResponse, apiError, checkRateLimit } from "@/lib/api-helpers";
import { updateCustomerSchema } from "@/lib/validations";
import type { UpdateCustomerBody } from "@/types";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error: authError } = await requireAuth();
  if (authError) return authError;

  const rateLimit = await checkRateLimit("customers");
  if (!rateLimit.allowed) return rateLimit.response;

  try {
    const { id } = await params;
    const body: UpdateCustomerBody = await request.json();
    const validated = updateCustomerSchema.parse(body);

    const updateData: any = {};
    if (validated.name !== undefined) updateData.name = validated.name;
    if (validated.contact !== undefined)
      updateData.contact = validated.contact || null;
    if (validated.favourite_product !== undefined)
      updateData.favourite_product = validated.favourite_product;

    const { data: customer, error: customerError } = await supabaseAdmin
      .from("customers")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (customerError) {
      if (customerError.code === "PGRST116") {
        return apiError("Customer not found", 404);
      }
      throw customerError;
    }

    if (validated.tag_ids) {
      await supabaseAdmin
        .from("customer_interests")
        .delete()
        .eq("customer_id", id);

      if (validated.tag_ids.length > 0) {
        const interests = validated.tag_ids.map((tagId) => ({
          customer_id: id,
          interest_tag_id: tagId,
        }));

        const { error: interestsError } = await supabaseAdmin
          .from("customer_interests")
          .insert(interests);

        if (interestsError) throw interestsError;
      }
    }

    return apiResponse(customer);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return apiError(error.errors[0].message, 400);
    }
    console.error("Failed to update customer:", error);
    return apiError("Failed to update customer");
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error: authError } = await requireAuth();
  if (authError) return authError;

  const rateLimit = await checkRateLimit("customers");
  if (!rateLimit.allowed) return rateLimit.response;

  try {
    const { id } = await params;
    const { error } = await supabaseAdmin
      .from("customers")
      .delete()
      .eq("id", id);

    if (error) {
      return apiError("Customer not found", 404);
    }

    return apiResponse({ success: true });
  } catch (error) {
    console.error("Failed to delete customer:", error);
    return apiError("Failed to delete customer");
  }
}
