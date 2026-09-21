const supabase = require("../supabase");

const createOrder = async (req, res, next) => {
    const { data, error } = await req.supabase
        .rpc("create_order");

    if (error) {
        return next(error);
    }

    res.status(201).json(data);
};

const getOrders = async (req, res, next) => {
    const { data, error } = await req.supabase
        .from("orders")
        .select(`
            id,
            status,
            total_amount,
            created_at,
            order_items (
                id,
                product_id,
                quantity,
                price
            )
        `)
        .eq("user_id", req.user.id)
        .order("created_at", { ascending: false });

    if (error) {
        return next(error);
    }

    res.json(data);
};

const getOrderById = async (req, res, next) => {
    const id = Number(req.params.id);

    const { data, error } = await req.supabase
        .from("orders")
        .select(`
            id,
            status,
            total_amount,
            created_at,
            order_items (
                id,
                product_id,
                quantity,
                price
            )
        `)
        .eq("id", id)
        .eq("user_id", req.user.id)
        .single();

    if (error) {
        if (error.code === "PGRST116") {
            return res.status(404).json({
                error: "Order not found"
            });
        }

        return next(error);
    }

    res.json(data);
};

module.exports = {
    createOrder,
    getOrders,
    getOrderById
};