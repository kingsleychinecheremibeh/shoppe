import NodeCache from "node-cache";

const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

export const cacheMiddleware = (durationSeconds = 300) => {
    return (req, res, next) => {
        if (req.method !== "GET") {
            return next();
        }

        const key = req.originalUrl || req.url;
        const cachedResponse = cache.get(key);
        if (cachedResponse) {
            return res.status(200).json(cachedResponse);
        }

        const originalJson = res.json;
        res.json = function (body) {
            if (res.statusCode === 200) {
                cache.set(key, body, durationSeconds);
            }
            return originalJson.call(this, body);
        };

        next();
    };
};

export const invalidateCache = (urlPattern) => {
    const keys = cache.keys();
    const matchedKeys = keys.filter((key) => key.includes(urlPattern));
    if (matchedKeys.length > 0) {
        matchedKeys.forEach((key) => cache.del(key));
    }
};
