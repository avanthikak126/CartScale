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

    res.json({
        user: data.user,
        access_token: data.session.access_token
    });
};

module.exports = {
    login
};