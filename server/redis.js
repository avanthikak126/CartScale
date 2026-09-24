const { createClient } = require("redis");

const redis = createClient({
    url: "redis://localhost:6379"
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