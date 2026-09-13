const requireAdmin = async (req, res, next) => {
    const { data, error } = await req.supabase
        .from("profiles")
        .select("role")
        .eq("id", req.user.id)
        .single();

    if (error || !data || data.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
    }

    next();
};

module.exports = requireAdmin;