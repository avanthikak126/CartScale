const supabase = require("../supabase");
const productSchema = require("../validators/productValidator");
const paginationSchema = require("../validators/paginationValidator");
const { redis } = require("../redis");

const clearProductCache = async () => {
    try {
        if (!redis || !redis.isOpen) return;
        const keys = await redis.sMembers("product_cache_keys");

        if (keys && keys.length > 0) {
            await redis.del(keys);
            await redis.del("product_cache_keys");
        }
    } catch (err) {
        console.error("Redis cache clear error:", err.message);
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
    let categoryId = req.query.category_id
        ? Number(req.query.category_id)
        : null;

    if (!categoryId && req.query.category) {
        const catName = req.query.category.replace(/-/g, " ").trim();
        const { data: cat } = await supabase
            .from("categories")
            .select("id")
            .ilike("name", catName)
            .single();
        if (cat) categoryId = cat.id;
    }

    const search = (req.query.search || req.query.q || "").trim();
    const sort = (req.query.sort || "").trim();
    const cacheKey = `products:${page}:${limit}:${categoryId ?? "all"}:${search || "all"}:${sort || "default"}`;

    if (redis && redis.isOpen) {
        try {
            const cachedData = await redis.get(cacheKey);
            if (cachedData) {
                return res.json(JSON.parse(cachedData));
            }
        } catch (err) {
            console.error("Redis cache get error:", err.message);
        }
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Build the data query
    let query = supabase
        .from("products")
        .select("*, categories(name)");

    // Build the count query
    let countQuery = supabase
        .from("products")
        .select("id", { count: "exact", head: true });

    if (categoryId) {
        query = query.eq("category_id", categoryId);
        countQuery = countQuery.eq("category_id", categoryId);
    }

    if (search) {
        query = query.ilike("name", `%${search}%`);
        countQuery = countQuery.ilike("name", `%${search}%`);
    }

    // Apply sorting
    if (sort === "price-low") {
        query = query.order("price", { ascending: true });
    } else if (sort === "price-high") {
        query = query.order("price", { ascending: false });
    } else if (sort === "name-az") {
        query = query.order("name", { ascending: true });
    } else if (sort === "name-za") {
        query = query.order("name", { ascending: false });
    } else {
        query = query.order("id");
    }

    const [{ data, error }, { count, error: countError }] = await Promise.all([
        query.range(from, to),
        countQuery
    ]);

    if (error) {
        console.error("Supabase query error:", JSON.stringify(error));
        return next(error);
    }

    const total = count ?? 0;
    const totalPages = Math.ceil(total / limit);

    const responseData = {
        products: data,
        page,
        limit,
        total,
        totalPages
    };

    if (redis && redis.isOpen) {
        try {
            await redis.setEx(cacheKey, 60, JSON.stringify(responseData));
            await redis.sAdd("product_cache_keys", cacheKey);
        } catch (err) {
            console.error("Redis cache set error:", err.message);
        }
    }

    res.json(responseData);
};
const getProductById = async (req, res,next) => {
    const id = Number(req.params.id);

    const { data, error } = await supabase
        .from("products")
        .select("*, inventory(quantity)")
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