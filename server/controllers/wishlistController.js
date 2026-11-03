const getWishlist = async (req, res, next) => {
    const { data: items, error } = await req.supabase
        .from("wishlists")
        .select(`
            id,
            product_id,
            created_at,
            products (
                id,
                name,
                price,
                category_id,
                categories (
                    name
                )
            )
        `)
        .eq("user_id", req.user.id);

    if (error) return next(error);

    res.json({
        items: items || []
    });
};

const addWishlistItem = async (req, res, next) => {
    const { product_id } = req.body;

    if (!product_id) {
        return res.status(400).json({
            error: "product_id is required"
        });
    }

    const { data: existing, error: existingError } = await req.supabase
        .from("wishlists")
        .select()
        .eq("user_id", req.user.id)
        .eq("product_id", product_id)
        .maybeSingle();

    if (existingError) return next(existingError);

    const { data, error } = await req.supabase
        .from("wishlists")
        .upsert(
            { user_id: req.user.id, product_id },
            { onConflict: "user_id,product_id" }
        )
        .select()
        .single();

    if (error) return next(error);

    if (existing) {
        return res.status(200).json(data);
    }

    res.status(201).json(data);
};

const removeWishlistItem = async (req, res, next) => {
    const product_id = Number(req.params.product_id);

    const { data, error } = await req.supabase
        .from("wishlists")
        .delete()
        .eq("user_id", req.user.id)
        .eq("product_id", product_id)
        .select();

    if (error) {
        if (error.code === "PGRST116") {
            return res.status(404).json({
                error: "Wishlist item not found"
            });
        }

        return next(error);
    }

    if (!data || data.length === 0) {
        return res.status(404).json({
            error: "Wishlist item not found"
        });
    }

    res.json({
        message: "Removed from wishlist"
    });
};

const checkWishlistItem = async (req, res, next) => {
    const product_id = Number(req.params.product_id);

    const { data, error } = await req.supabase
        .from("wishlists")
        .select("id")
        .eq("user_id", req.user.id)
        .eq("product_id", product_id)
        .maybeSingle();

    if (error) return next(error);

    res.json({
        inWishlist: !!data
    });
};

module.exports = {
    getWishlist,
    addWishlistItem,
    removeWishlistItem,
    checkWishlistItem
};
