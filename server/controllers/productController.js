const supabase = require("../supabase");
const productSchema = require("../validators/productValidator");
const paginationSchema = require("../validators/paginationValidator");

const getProducts = async (req, res,next) => {
    const result = paginationSchema.safeParse(req.query);

if (!result.success) {
    return res.status(400).json({
        error: result.error.issues[0].message
    });
}

const { page, limit } = result.data;
    

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error } = await supabase
        .from("products")
        .select("*")
        .range(from, to);

   if (error) {
    return next(error);
}


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

    res.status(201).json(data);
};

module.exports = {
    getProducts,
    getProductById,
    createProduct
};