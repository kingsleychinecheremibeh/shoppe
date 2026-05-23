import { isRedisReady, redisClient } from "../config/redis.js";

const CACHE_KEY_PREFIX = "cache:response:";

const getCacheKey = (req) => {
    return `${CACHE_KEY_PREFIX}${req.originalUrl || req.url}`;
};

export const cacheMiddleware = (durationSeconds = 300) => {
    return async (req, res, next) => {
        if (req.method !== "GET") {
            return next();
        }

        if (req.originalUrl?.startsWith("/api/v1/auth") || req.headers.cookie || req.headers.authorization) {
            return next();
        }

        if (!isRedisReady()) {
            return next();
        }

        const key = getCacheKey(req);

        try {
            const cachedResponse = await redisClient.get(key);
            if (cachedResponse) {
                console.log("[Redis] HIT", key)
                return res.status(200).json(JSON.parse(cachedResponse));
            }
        } catch (err) {
            console.error("[Redis] Cache read failed:", err.message);
            return next();
        }

        const originalJson = res.json;
        res.json = function (body) {
            if (res.statusCode === 200) {
                console.log("[Redis] SET", key);
                redisClient
                    .setEx(key, durationSeconds, JSON.stringify(body))
                    .catch((err) => console.error("[Redis] Cache write failed:", err.message));
            }
            return originalJson.call(this, body);
        };

        next();
    };
};

export const invalidateCache = async (urlPattern) => {
    if (!isRedisReady()) return;

    const matchPattern = `${CACHE_KEY_PREFIX}*${urlPattern}*`;
    const keysToDelete = [];

    try {
        for await (const key of redisClient.scanIterator({ MATCH: matchPattern, COUNT: 100 })) {
            keysToDelete.push(key);
        }

        if (keysToDelete.length > 0) {
            await redisClient.del(keysToDelete);
        }
    } catch (err) {
        console.error("[Redis] Cache invalidation failed:", err.message);
    }
};
