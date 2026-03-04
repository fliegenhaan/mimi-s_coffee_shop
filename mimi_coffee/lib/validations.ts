import { z } from "zod";

export const createCustomerSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  contact: z.string().email("Invalid email address").optional().or(z.literal("")),
  favourite_product: z
    .string()
    .min(1, "Favorite product is required")
    .max(200, "Product name is too long"),
  tag_ids: z
    .array(z.string().uuid("Invalid tag ID"))
    .min(1, "At least one tag is required"),
});

export const updateCustomerSchema = createCustomerSchema
  .partial()
  .extend({
    tag_ids: z.array(z.string().uuid("Invalid tag ID")).optional(),
  });

export const getCustomersQuerySchema = z.object({
  search: z.string().optional(),
  tags: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const generateCampaignSchema = z.object({
  period: z.enum(["all_time", "7d", "30d"], {
    message: "Period must be 'all_time', '7d', or '30d'",
  }),
});

export const chatSchema = z.object({
  message: z.string().min(1, "Message is required").max(1000, "Message is too long"),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })
    )
    .optional(),
});

export const createTagSchema = z.object({
  name: z
    .string()
    .min(1, "Tag name is required")
    .max(50, "Tag name is too long")
    .transform((val) => val.trim()),
});
