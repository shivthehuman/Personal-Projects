import rateLimit from "express-rate-limit";

// Rate limit for authentication endpoints (register, login)
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per window
    message: "Too many authentication attempts, please try again later.",
    standardHeaders: false,
    legacyHeaders: false,
    skip: (req) => process.env.NODE_ENV === "development", // Disable in dev
});

// Rate limit for order creation
export const orderLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 orders per minute per user
    keyGenerator: (req) => {
        // Rate limit per user ID (from auth middleware)
        return (req as any).authUser?.id ?? req.ip ?? "unknown";
    },
    message: "Too many orders created, please wait before placing another order.",
    standardHeaders: false,
    legacyHeaders: false,
    skip: (req) => process.env.NODE_ENV === "development",
});

// General API limiter for all endpoints
export const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
    message: "Too many requests, please try again later.",
    standardHeaders: false,
    legacyHeaders: false,
    skip: (req) => process.env.NODE_ENV === "development",
});
