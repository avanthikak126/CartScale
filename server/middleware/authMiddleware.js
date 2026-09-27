const { createClient } = require("@supabase/supabase-js");

const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Missing token" });
    }

    const token = authHeader.split(" ")[1];

    if (!token || token.length < 10) {
        console.warn("[AUTH] Received malformed token (length:", token?.length, ")");
        return res.status(401).json({ error: "Invalid token" });
    }

    const userClient = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_KEY,
        {
            global: {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        }
    );

    const {
        data: { user },
        error
    } = await userClient.auth.getUser(token);

    if (error || !user) {
        console.warn("[AUTH] Token rejected by Supabase:", error?.message || "no user returned");
        return res.status(401).json({ error: "Invalid token" });
    }

    req.supabase = userClient;
    req.user = user;

    next();
};

module.exports = authMiddleware;
