const supabase = require("../supabase");

const getCategories = async (req, res, next) => {
    const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("id");

    if (error) {
        return next(error);
    }

    res.json(data);
};

const getCategoryById = async (req, res, next) => {
    const id = Number(req.params.id);

    const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("id", id)
        .single();

    if (error) {
        if (error.code === "PGRST116") {
            return res.status(404).json({
                error: "Category not found"
            });
        }

        return next(error);
    }

    res.json(data);
};

const createCategory = async (req, res, next) => {
    const { name } = req.body;

    if (!name || !name.trim()) {
        return res.status(400).json({
            error: "Category name is required"
        });
    }

    const { data, error } = await req.supabase
        .from("categories")
        .insert({ name: name.trim() })
        .select()
        .single();

    if (error) {
        return next(error);
    }

    res.status(201).json(data);
};

const updateCategory = async (req, res, next) => {
    const id = Number(req.params.id);
    const { name } = req.body;

    if (!name || !name.trim()) {
        return res.status(400).json({
            error: "Category name is required"
        });
    }

    const { data, error } = await req.supabase
        .from("categories")
        .update({ name: name.trim() })
        .eq("id", id)
        .select()
        .single();

    if (error) {
        if (error.code === "PGRST116") {
            return res.status(404).json({
                error: "Category not found"
            });
        }

        return next(error);
    }

    res.json(data);
};

const deleteCategory = async (req, res, next) => {
    const id = Number(req.params.id);

    const { data, error } = await req.supabase
        .from("categories")
        .delete()
        .eq("id", id)
        .select()
        .single();

    if (error) {
        if (error.code === "PGRST116") {
            return res.status(404).json({
                error: "Category not found"
            });
        }

        return next(error);
    }

    res.json({
        message: "Category deleted successfully",
        category: data
    });
};

module.exports = {
    getCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
};