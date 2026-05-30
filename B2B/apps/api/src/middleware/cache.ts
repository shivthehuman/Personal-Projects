import type { RequestHandler } from "express";
import { getCached, setCached } from "../lib/redis-client.js";

/**
 * Middleware to cache GET requests
 * @param keyPrefix - Prefix for cache keys (e.g., "products")
 * @param ttlSeconds - Time to live in seconds (default: 300 = 5 minutes)
 */
export function cacheMiddleware(keyPrefix: string, ttlSeconds: number = 300): RequestHandler {
    return async (req, res, next) => {
        // Only cache GET requests
        if (req.method !== "GET") {
            return next();
        }

        try {
            // Generate cache key from request URL and query params
            const cacheKey = `${keyPrefix}:${req.url}`;

            // Try to get from cache
            const cached = await getCached<unknown>(cacheKey);
            if (cached !== null) {
                res.setHeader("X-Cache", "HIT");
                return res.json(cached);
            }

            // Intercept response to cache it
            const originalJson = res.json.bind(res);
            res.json = function (data: unknown) {
                res.setHeader("X-Cache", "MISS");

                // Cache the response asynchronously (don't wait)
                void setCached(cacheKey, data, ttlSeconds).catch((err) => {
                    console.error("Cache set error:", err);
                });

                return originalJson(data);
            };

            return next();
        } catch (err) {
            console.error("Cache middleware error:", err);
            // Continue without caching on error
            return next();
        }
    };
}
