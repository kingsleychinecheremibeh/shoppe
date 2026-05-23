import { createClient } from "redis";

const redisUrl = process.env.REDIS_URL;

export const redisClient = createClient({
  url: redisUrl,
});

redisClient.on("error", (err) => {
  console.error("[Redis] Client error:", err.message);
});

export const connectRedis = async () => {
  if (process.env.NODE_ENV === "test") return;

  if (!redisUrl) {
    console.warn("[Redis] REDIS_URL is not set. Response cache is disabled.");
    return;
  }

  if (!redisClient.isOpen) {
    await redisClient.connect();
    console.info("[Redis] Connected");
  }
};

export const isRedisReady = () => {
  return Boolean(redisUrl && redisClient.isReady);
};
