import { createClient } from "redis";
import { logger } from "../utils/logger.js";

const redisUrl = process.env.REDIS_URL;

export const redisClient = createClient({
  url: redisUrl,
});

redisClient.on("error", (err) => {
  logger.error("[Redis] Client error:",{ error: err.message, stack: err.stack });
});

export const connectRedis = async () => {
  if (process.env.NODE_ENV === "test") return;

  if (!redisUrl) {
    console.warn("[Redis] REDIS_URL is not set. Response cache is disabled.");
    return;
  }

  if (!redisClient.isOpen) {
    await redisClient.connect();
    logger.info("[Redis] Connected");
  }
};

export const isRedisReady = () => {
  return Boolean(redisUrl && redisClient.isReady);
};
