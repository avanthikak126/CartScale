const supabase = require("../supabase");
const productSchema = require("../validators/productValidator");
const paginationSchema = require("../validators/paginationValidator");
const { redis } = require("../redis");

const clearProductCache = async () => {
    const keys = await redis.sMembers("product_cache_keys");

    if (keys.length > 0) {
        await redis.del(keys);
        await redis.del("product_cache_keys");
    }
};

const getProducts = async (req, res, next) => {
    const result = paginationSchema.safeParse(req.query);

    if (!result.success) {
        return res.status(400).json({
            error: result.error.issues[0].message
        });
    }

    const { page, limit } = result.data;
    const categoryId = req.query.category_id
    ? Number(req.query.category_id)
    : null;

const cacheKey = `products:${page}:${limit}:${categoryId ?? "all"}`;

const cachedData = await redis.get(cacheKey);

if (cachedData) {
    return res.json(JSON.parse(cachedData));
}
    

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
        .from("products")
        .select("id, name, price, category_id")
        .order("id");

    if (categoryId) {
        query = query.eq("category_id", categoryId);
    }

    const { data, error } = await query.range(from, to);

if (error) {
    return next(error);
}


await redis.setEx(cacheKey, 60, JSON.stringify(data));
await redis.sAdd("product_cache_keys", cacheKey);

res.json(data);
};
const getProductById = async (req, res,next) => {
    const id = Number(req.params.id);

    const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();

    if (error) {
    if (error.code === "PGRST116") {
        return res.status(404).json({
            error: "Product not found"
        });
    }

    return next(error);
}

    res.json(data);
};
const createProduct = async (req, res,next) => {
    const result = productSchema.safeParse(req.body);

    if (!result.success) {
        return res.status(400).json({
            error: result.error.issues[0].message
        });
    }

    const { name, description, price, category_id } = result.data;

    const { data, error } = await req.supabase
        .from("products")
        .insert({
            name,
            description,
            price,
            category_id
        })
        .select()
        .single();

    if (error) {
    return next(error);
}

await clearProductCache();

res.status(201).json(data);
};
const updateProduct = async (req, res, next) => {
    const id = Number(req.params.id);

    const result = productSchema.partial().safeParse(req.body);

    if (!result.success) {
        return res.status(400).json({
            error: result.error.issues[0].message
        });
    }

    const { data, error } = await req.supabase
        .from("products")
        .update(result.data)
        .eq("id", id)
        .select()
        .single();

    if (error) {
    if (error.code === "PGRST116") {
        return res.status(404).json({
            error: "Product not found"
        });
    }

    return next(error);
}

await clearProductCache();

res.json(data);
};
const deleteProduct = async (req, res, next) => {
    const id = Number(req.params.id);

    const { data, error } = await req.supabase
        .from("products")
        .delete()
        .eq("id", id)
        .select()
        .single();

    if (error) {
    if (error.code === "PGRST116") {
        return res.status(404).json({
            error: "Product not found"
        });
    }

    return next(error);
}

await clearProductCache();

res.json({
    message: "Product deleted successfully",
    product: data
});
    
};
module.exports = {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
};