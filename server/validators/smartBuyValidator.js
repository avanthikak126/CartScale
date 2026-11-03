const { z } = require("zod");

const recommendSchema = z.object({
  query: z.string().trim().max(200).optional().nullable(),
  budget: z.coerce.number().positive("Budget must be greater than ₹0").optional().nullable(),
  category_id: z.coerce.number().int().positive().optional().nullable(),
  preferred_brand: z.string().trim().max(50).optional().nullable(),
  sort_by: z.enum(["smart", "rating", "price_low", "price_high"]).optional().default("smart"),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20)
});

module.exports = {
  recommendSchema
};
