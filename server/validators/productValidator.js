const { z } = require("zod");

const productSchema = z.object({
    name: z.string().trim().min(1),
    description: z.string().optional(),
    price: z.coerce.number().positive(),
    category_id: z.coerce.number().int()
});

module.exports = productSchema;