const { createClient } = require("redis");

const redis = createClient({
    url: "redis://127.0.0.1:6379",
    disableOfflineQueue: true
});

redis.on("error", (err) => {
    console.error("Redis error:", err);
});

const connectRedis = async () => {
    await redis.connect();
    console.log("Redis connected");
};

module.exports = {
    redis,
    connectRedis
};