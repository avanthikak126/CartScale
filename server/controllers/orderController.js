const supabase = require("../supabase");

const createOrder = async (req, res, next) => {
    const { address_id, payment_method } = req.body || {};

    const rpcParams = {};
    if (address_id) rpcParams.p_address_id = address_id;
    if (payment_method) rpcParams.p_payment_method = payment_method;

    let { data, error } = await req.supabase
        .rpc("create_order", rpcParams);

    // Fall back to no-arg create_order if database has not applied migration 002
    if (error && Object.keys(rpcParams).length > 0 && error.code === "PGRST202") {
        const fallback = await req.supabase.rpc("create_order");
        data = fallback.data;
        error = fallback.error;
    }

    if (error) {
        return next(error);
    }

    res.status(201).json(data);
};

const getOrders = async (req, res, next) => {
    let { data, error } = await req.supabase
        .from("orders")
        .select(`
            id,
            status,
            total_amount,
            created_at,
            address_id,
            payment_method,
            addresses (
                id,
                full_name,
                phone,
                address_line,
                city,
                state,
                pincode
            ),
            order_items (
                id,
                product_id,
                quantity,
                price
            )
        `)
        .eq("user_id", req.user.id)
        .order("created_at", { ascending: false });

    if (error && (error.code === "PGRST200" || error.code === "PGRST205" || error.code === "42703")) {
        const fallback = await req.supabase
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

        data = fallback.data;
        error = fallback.error;
    }

    if (error) {
        return next(error);
    }

    res.json(data);
};

const getOrderById = async (req, res, next) => {
    const id = Number(req.params.id);

    let { data, error } = await req.supabase
        .from("orders")
        .select(`
            id,
            status,
            total_amount,
            created_at,
            address_id,
            payment_method,
            addresses (
                id,
                full_name,
                phone,
                address_line,
                city,
                state,
                pincode
            ),
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

    if (error && (error.code === "PGRST200" || error.code === "PGRST205" || error.code === "42703")) {
        const fallback = await req.supabase
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

        data = fallback.data;
        error = fallback.error;
    }

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