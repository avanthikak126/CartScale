const { createClient } = require("redis");

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

const redis = createClient({
    url: redisUrl,
    disableOfflineQueue: true
});

redis.on("error", (err) => {
    console.error("Redis error:", err.message || err);
});

const connectRedis = async () => {
    try {
        if (!redis.isOpen) {
            await redis.connect();
            console.log("Redis connected");
        }
    } catch (err) {
        console.error("Failed to connect to Redis:", err.message || err);
    }
};

module.exports = {
    redis,
    connectRedis
};