const getCart = async (req, res, next) => {
    let { data: cart, error } = await req.supabase
        .from("carts")
        .select("id")
        .eq("user_id", req.user.id)
        .maybeSingle();

    if (error) return next(error);

    if (!cart) {
        const { data, error } = await req.supabase
            .from("carts")
            .insert({ user_id: req.user.id })
            .select("id")
            .single();

        if (error) return next(error);

        cart = data;
    }

    const { data: items, error: itemsError } = await req.supabase
        .from("cart_items")
        .select(`
            id,
            quantity,
            product_id,
            products (
                id,
                name,
                price
            )
        `)
        .eq("cart_id", cart.id);

    if (itemsError) return next(itemsError);

    res.json({
        id: cart.id,
        items
    });
};


const addCartItem = async (req, res, next) => {
    const { product_id, quantity = 1 } = req.body;

    if (!product_id || quantity < 1) {
        return res.status(400).json({
            error: "Valid product_id and quantity are required"
        });
    }

    const { data: cart, error: cartError } = await req.supabase
        .from("carts")
        .select("id")
        .eq("user_id", req.user.id)
        .single();

    if (cartError) return next(cartError);

    const { data: existing, error: existingError } = await req.supabase
        .from("cart_items")
        .select("id, quantity")
        .eq("cart_id", cart.id)
        .eq("product_id", product_id)
        .maybeSingle();

    if (existingError) return next(existingError);

    if (existing) {
        const { data, error } = await req.supabase
            .from("cart_items")
            .update({
                quantity: existing.quantity + quantity
            })
            .eq("id", existing.id)
            .select()
            .single();

        if (error) return next(error);

        return res.json(data);
    }

    const { data, error } = await req.supabase
        .from("cart_items")
        .insert({
            cart_id: cart.id,
            product_id,
            quantity
        })
        .select()
        .single();

    if (error) return next(error);

    res.status(201).json(data);
};


const updateCartItem = async (req, res, next) => {
    const id = Number(req.params.id);
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
        return res.status(400).json({
            error: "Quantity must be greater than 0"
        });
    }

    const { data: cart, error: cartError } = await req.supabase
        .from("carts")
        .select("id")
        .eq("user_id", req.user.id)
        .single();

    if (cartError) return next(cartError);

    const { data, error } = await req.supabase
        .from("cart_items")
        .update({ quantity })
        .eq("id", id)
        .eq("cart_id", cart.id)
        .select()
        .single();

    if (error) {
        if (error.code === "PGRST116") {
            return res.status(404).json({
                error: "Cart item not found"
            });
        }

        return next(error);
    }

    res.json(data);
};

const deleteCartItem = async (req, res, next) => {
    const id = Number(req.params.id);

    const { data: cart, error: cartError } = await req.supabase
        .from("carts")
        .select("id")
        .eq("user_id", req.user.id)
        .single();

    if (cartError) return next(cartError);

    const { data, error } = await req.supabase
        .from("cart_items")
        .delete()
        .eq("id", id)
        .eq("cart_id", cart.id)
        .select()
        .single();

    if (error) {
        if (error.code === "PGRST116") {
            return res.status(404).json({
                error: "Cart item not found"
            });
        }

        return next(error);
    }

    res.json({
        message: "Cart item removed",
        item: data
    });
};


module.exports = {
    getCart,
    addCartItem,
    updateCartItem,
    deleteCartItem
};