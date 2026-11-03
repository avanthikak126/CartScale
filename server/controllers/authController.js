const supabase = require("../supabase");

const login = async (req, res) => {
    const { email, password } = req.body;

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        return res.status(401).json({ error: error.message });
    }

    // Auto-create profile if missing to prevent silent failures on authenticated routes
    const { createClient } = require("@supabase/supabase-js");
    const userClient = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_PUBLISHABLE_KEY,
        {
            global: {
                headers: {
                    Authorization: `Bearer ${data.session.access_token}`
                }
            },
            auth: { persistSession: false }
        }
    );

    const { data: profile } = await userClient
        .from("profiles")
        .select("id")
        .eq("id", data.user.id)
        .maybeSingle();

    if (!profile) {
        await userClient.from("profiles").insert({
            id: data.user.id,
            name: data.user.user_metadata?.full_name || email.split("@")[0],
            role: "customer"
        });
    }

    res.json({
        user: data.user,
        access_token: data.session.access_token
    });
};

const signup = async (req, res) => {
    const { email, password, fullName } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
    }

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { full_name: fullName }
        }
    });

    if (error) {
        return res.status(400).json({ error: error.message });
    }

    if (data?.user?.identities && data.user.identities.length === 0) {
        return res.status(400).json({ error: "An account with this email already exists" });
    }

    if (!data.session) {
        return res.json({
            message: "Please check your email to verify your account.",
            user: data.user,
            emailConfirmRequired: true
        });
    }

    const { createClient } = require("@supabase/supabase-js");
    const userClient = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_PUBLISHABLE_KEY,
        {
            global: {
                headers: {
                    Authorization: `Bearer ${data.session.access_token}`
                }
            },
            auth: { persistSession: false }
        }
    );

    const { data: profile } = await userClient
        .from("profiles")
        .select("id")
        .eq("id", data.user.id)
        .maybeSingle();

    if (!profile) {
        await userClient.from("profiles").insert({
            id: data.user.id,
            name: fullName || email.split("@")[0],
            role: "customer"
        });
    }

    res.json({
        user: data.user,
        access_token: data.session.access_token,
        message: "Account created successfully!"
    });
};

module.exports = {
    login,
    signup
};