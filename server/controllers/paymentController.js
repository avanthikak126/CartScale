const Razorpay = require("razorpay");
const crypto = require("crypto");

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const createPaymentOrder = async (req, res) => {
    try {
        const { data: cart, error: cartError } = await req.supabase
            .from("carts")
            .select("id")
            .eq("user_id", req.user.id)
            .single();

        if (cartError) {
            return res.status(400).json({
                error: "Cart not found"
            });
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

        if (itemsError) {
            return res.status(400).json({
                error: "Could not get cart items"
            });
        }

        if (!items || items.length === 0) {
            return res.status(400).json({
                error: "Cart is empty"
            });
        }

        const total = items.reduce(
            (sum, item) =>
                sum + Number(item.products.price) * item.quantity,
            0
        );

        const razorpayOrder = await razorpay.orders.create({
            amount: Math.round(total * 100),
            currency: "INR",
            receipt: `cartscale_${Date.now()}`
        });

        res.json({
            id: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency
        });

    } catch (error) {
        console.error("PAYMENT ERROR:", error);
        console.error("MESSAGE:", error.message);
        console.error("STATUS:", error.statusCode);

        res.status(500).json({
            error: "Failed to create payment order"
        });
    }
};

const verifyPayment = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({
                error: "Missing payment verification fields"
            });
        }

        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({
                error: "Invalid payment signature"
            });
        }

        // Signature is valid — the payment is genuine.
        // TODO: Update your orders table to mark the order as paid here.
        // For now, we return success so the frontend knows verification passed.

        res.json({
            verified: true,
            razorpay_order_id,
            razorpay_payment_id
        });

    } catch (error) {
        console.error("VERIFY ERROR:", error);

        res.status(500).json({
            error: "Payment verification failed"
        });
    }
};

module.exports = {
    createPaymentOrder,
    verifyPayment
};