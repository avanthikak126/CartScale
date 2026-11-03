const { z } = require("zod");

const recommendSchema = z.object({
  budget: z.coerce.number().positive("Budget must be greater than ₹0"),
  category_id: z.coerce.number().int().positive().optional().nullable(),
  query: z.string().trim().max(200).optional().nullable(),
  preferred_brand: z.string().trim().max(50).optional().nullable(),
  sort_by: z.enum(["smart", "rating", "price_low"]).optional().default("smart"),
  limit: z.coerce.number().int().min(1).max(50).optional().default(12)
});

const bundleCategoryRequirementSchema = z.object({
  category_id: z.coerce.number().int().positive("Invalid category id"),
  name: z.string().optional(),
  count: z.coerce.number().int().min(1).max(5).optional().default(1)
});

const bundleSchema = z.object({
  budget: z.coerce.number().positive("Budget must be greater than ₹0"),
  categories: z.array(bundleCategoryRequirementSchema).min(1, "Select at least 1 category for the bundle"),
  strategy: z.enum(["best_value", "budget_saver"]).optional().default("best_value")
});

const parseSchema = z.object({
  query: z.string().trim().min(1, "Query cannot be empty").max(300)
});

module.exports = {
  recommendSchema,
  bundleSchema,
  parseSchema
};
