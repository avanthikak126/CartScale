require("dotenv").config({ path: require("path").join(__dirname, ".env") });

const express = require("express");
const cors = require("cors");
const productRoutes = require("./routes/productRoutes");
const authRoutes = require("./routes/authRoutes");
const errorMiddleware = require("./middleware/errorMiddleware");
const categoryRoutes = require("./routes/categoryRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const addressRoutes = require("./routes/addressRoutes");
const { connectRedis, redis } = require("./redis");
const rateLimit = require("express-rate-limit");
const paymentRoutes = require("./routes/paymentRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");
const smartBuyRoutes = require("./routes/smartBuyRoutes");

const app = express();
app.use(cors({
    origin: "http://localhost:5173"
}));
const limiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 100,
    message: {
        error: "Too many requests. Please try again later."
    }
});

app.use(limiter);
app.use(express.json());


app.use(productRoutes);
app.use(authRoutes);
app.use(categoryRoutes);
app.use(cartRoutes);
app.use(orderRoutes);
app.use(addressRoutes);
app.use(paymentRoutes);
app.use(wishlistRoutes);
app.use(smartBuyRoutes);
app.get("/health", async (req, res) => {
    try {
        await redis.ping();

        res.json({
            status: "ok",
            redis: "connected"
        });
    } catch (error) {
        res.status(503).json({
            status: "error",
            redis: "disconnected"
        });
    }
});
app.use((req, res, next) => {
    res.status(404).json({
        error: "Route not found"
    });
});
app.use(errorMiddleware);

app.get("/", (req, res) => {
    res.send("CartScale API is running");
});

if (require.main === module) {
    connectRedis();

    app.listen(3000, () => {
        console.log("Server running on port 3000");
    });
}

module.exports = app;