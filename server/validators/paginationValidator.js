const { z } = require("zod");

const paginationSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(50).default(20)
});

module.exports = paginationSchema;