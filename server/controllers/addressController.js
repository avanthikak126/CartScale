const getAddresses = async (req, res, next) => {
    const { data, error } = await req.supabase
        .from("addresses")
        .select("*")
        .eq("user_id", req.user.id)
        .order("created_at", { ascending: false });

    if (error) return next(error);

    res.json(data);
};

const createAddress = async (req, res, next) => {
    const { full_name, phone, address_line, city, state, pincode } = req.body;

    if (!full_name || !phone || !address_line || !city || !state || !pincode) {
        return res.status(400).json({
            error: "All address fields are required"
        });
    }

    const { data, error } = await req.supabase
        .from("addresses")
        .insert({
            user_id: req.user.id,
            full_name: full_name.trim(),
            phone: phone.trim(),
            address_line: address_line.trim(),
            city: city.trim(),
            state: state.trim(),
            pincode: pincode.trim()
        })
        .select()
        .single();

    if (error) return next(error);

    res.status(201).json(data);
};

const updateAddress = async (req, res, next) => {
    const id = Number(req.params.id);
    const { full_name, phone, address_line, city, state, pincode } = req.body;

    const updates = {};
    if (full_name) updates.full_name = full_name.trim();
    if (phone) updates.phone = phone.trim();
    if (address_line) updates.address_line = address_line.trim();
    if (city) updates.city = city.trim();
    if (state) updates.state = state.trim();
    if (pincode) updates.pincode = pincode.trim();

    if (Object.keys(updates).length === 0) {
        return res.status(400).json({
            error: "At least one field is required to update"
        });
    }

    const { data, error } = await req.supabase
        .from("addresses")
        .update(updates)
        .eq("id", id)
        .eq("user_id", req.user.id)
        .select()
        .single();

    if (error) {
        if (error.code === "PGRST116") {
            return res.status(404).json({
                error: "Address not found"
            });
        }
        return next(error);
    }

    res.json(data);
};

const deleteAddress = async (req, res, next) => {
    const id = Number(req.params.id);

    const { data, error } = await req.supabase
        .from("addresses")
        .delete()
        .eq("id", id)
        .eq("user_id", req.user.id)
        .select()
        .single();

    if (error) {
        if (error.code === "PGRST116") {
            return res.status(404).json({
                error: "Address not found"
            });
        }
        return next(error);
    }

    res.json({
        message: "Address deleted",
        address: data
    });
};

module.exports = {
    getAddresses,
    createAddress,
    updateAddress,
    deleteAddress
};
