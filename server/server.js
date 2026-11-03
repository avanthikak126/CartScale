require("dotenv").config({ path: require("path").join(__dirname, ".env") });

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const rateLimit = require("express-rate-limit");

const productRoutes = require("./routes/productRoutes");
const authRoutes = require("./routes/authRoutes");
const errorMiddleware = require("./middleware/errorMiddleware");
const categoryRoutes = require("./routes/categoryRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const addressRoutes = require("./routes/addressRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");
const smartBuyRoutes = require("./routes/smartBuyRoutes");
const { connectRedis, redis } = require("./redis");

const app = express();

// CORS configuration: preserve local dev access and allow same-origin in production
const allowedOrigins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173"
];

if (process.env.CLIENT_URL) {
    allowedOrigins.push(process.env.CLIENT_URL);
}

if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    allowedOrigins.push(`https://${process.env.RAILWAY_PUBLIC_DOMAIN}`);
    allowedOrigins.push(`http://${process.env.RAILWAY_PUBLIC_DOMAIN}`);
}

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like same-origin requests, curl, or mobile apps)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        // Allow railway.app subdomains for this deployment if on Railway
        if (process.env.RAILWAY_ENVIRONMENT && origin.endsWith(".railway.app")) {
            return callback(null, true);
        }
        return callback(new Error("Not allowed by CORS"));
    },
    credentials: true
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

// Railway health check endpoint
app.get("/health", async (req, res) => {
    try {
        if (!redis.isOpen) {
            return res.status(503).json({
                status: "error",
                redis: "disconnected"
            });
        }
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

// Mount all backend API routes
app.use(productRoutes);
app.use(authRoutes);
app.use(categoryRoutes);
app.use(cartRoutes);
app.use(orderRoutes);
app.use(addressRoutes);
app.use(paymentRoutes);
app.use(wishlistRoutes);
app.use(smartBuyRoutes);

// Serve production React build static assets
const clientDistPath = path.join(__dirname, "../client/dist");
app.use(express.static(clientDistPath));

// Static asset guard: missing files with extensions must return 404 (not HTML)
app.use((req, res, next) => {
    if (path.extname(req.path)) {
        return res.status(404).json({ error: "Asset not found" });
    }
    next();
});

// Known API path prefixes in CartScale (endpoints that do not use /api prefix)
const API_PREFIXES = [
    "/api",
    "/health",
    "/products",
    "/categories",
    "/category",
    "/cart",
    "/orders",
    "/addresses",
    "/payments",
    "/wishlist",
    "/smartbuy"
];

// Helper to determine if an incoming request is intended for an API endpoint
function isApiRequest(req) {
    // 1. Non-GET/HEAD methods are always API calls
    if (req.method !== "GET" && req.method !== "HEAD") {
        return true;
    }

    // 2. Request explicitly asks for JSON or is an AJAX/fetch call
    const acceptHeader = req.headers.accept || "";
    if (acceptHeader.includes("application/json") || req.xhr) {
        return true;
    }

    // 3. Request path starts with /api
    if (req.path.startsWith("/api")) {
        return true;
    }

    // 4. Request matches any backend API prefix or subpath
    for (const prefix of API_PREFIXES) {
        if (req.path === prefix || req.path.startsWith(`${prefix}/`)) {
            // Frontend page exception: /smartbuy without subpath accessed via browser (Accept: text/html)
            if (req.path === "/smartbuy" && acceptHeader.includes("text/html")) {
                return false;
            }
            return true;
        }
    }

    // 5. /login and /signup: if client expects JSON or doesn't accept HTML, it's an API call
    if (req.path === "/login" || req.path === "/signup") {
        if (!acceptHeader.includes("text/html")) {
            return true;
        }
    }

    return false;
}

// React SPA fallback: for legitimate frontend page navigations, serve index.html
app.use((req, res, next) => {
    // Pass API requests and non-HTML requests directly to the 404 JSON handler
    if (isApiRequest(req) || !req.accepts("html")) {
        return next();
    }

    const indexPath = path.join(clientDistPath, "index.html");
    if (fs.existsSync(indexPath)) {
        return res.sendFile(indexPath);
    }
    if (req.path === "/") {
        return res.send("CartScale API is running");
    }
    next();
});

// Catch-all 404 handler for API routes and unhandled requests
app.use((req, res, next) => {
    res.status(404).json({
        error: "Route not found"
    });
});

// Global error handling middleware
app.use(errorMiddleware);

const PORT = process.env.PORT || 3000;
const HOST = "0.0.0.0";

if (require.main === module) {
    connectRedis();

    app.listen(PORT, HOST, () => {
        console.log(`Server running on http://${HOST}:${PORT}`);
    });
}

module.exports = app;