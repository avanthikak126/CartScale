require("dotenv").config();

const express = require("express");
const productRoutes = require("./routes/productRoutes");
const authRoutes = require("./routes/authRoutes");
const errorMiddleware = require("./middleware/errorMiddleware");
const categoryRoutes = require("./routes/categoryRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const { connectRedis } = require("./redis");
const rateLimit = require("express-rate-limit");

const app = express();
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