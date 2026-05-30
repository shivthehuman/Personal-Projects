import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";

import { sharedPackageName } from "@b2b/shared";
import { connectDb } from "./db/connect.js";
import { getEnv } from "./config/env.js";
import { getRedisClient } from "./lib/redis-client.js";
import { createAuthRouter } from "./routes/auth.router.js";
import { createOrganizationsRouter } from "./routes/organizations.router.js";
import { createOrderRouter } from "./routes/order.routes.js";
import { createProductRouter } from "./routes/product.routes.js";
import { createPushRouter } from "./routes/push.router.js";
import { createUsersRouter } from "./routes/users.router.js";
import { httpErrorHandler } from "./middleware/http-error-handler.js";
import { apiLimiter } from "./middleware/rate-limit.js";

async function main(): Promise<void> {
  const env = getEnv();
  await connectDb(env);

  // Initialize Redis client (non-blocking)
  void getRedisClient().then(() => {
    console.log("🚀 Redis initialized for caching");
  });

  const app = express();

  app.disable("x-powered-by");

  // Configure CORS to allow local dev, configured WEB_ORIGIN, and typical preview domains
  const allowedOrigins = ["http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173"];
  if (env.WEB_ORIGIN) allowedOrigins.push(env.WEB_ORIGIN);

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow non-browser requests (e.g., curl, server-to-server)
        if (!origin) return callback(null, true);

        // Exact match against configured origins
        if (allowedOrigins.includes(origin)) return callback(null, true);

        // Allow common preview hosts (Vercel, Render) by suffix
        try {
          const lower = origin.toLowerCase();
          if (lower.endsWith(".vercel.app") || lower.includes("vercel.app") || lower.endsWith(".onrender.com") || lower.includes("render.com")) {
            return callback(null, true);
          }
        } catch (e) {
          // fallthrough to reject
        }

        return callback(new Error("Not allowed by CORS"));
      },
      credentials: true,
    })
  );

  app.use(express.json({ limit: "512kb" }));
  app.use(cookieParser());

  // Apply general rate limiting
  app.use("/api", apiLimiter);

  // Serve uploaded files
  app.use(
    "/uploads",
    express.static(path.join(process.cwd(), "apps", "api", "uploads"))
  );

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, workspace: sharedPackageName });
  });

  app.use("/api/auth", createAuthRouter(env));
  app.use("/api/organizations", createOrganizationsRouter(env));
  app.use("/api/orders", createOrderRouter(env));
  app.use("/api/products", createProductRouter(env));
  app.use("/api/push", createPushRouter(env));
  app.use("/api/users", createUsersRouter(env));

  app.use((_req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  app.use(httpErrorHandler);

  app.listen(env.PORT, () => {
    console.log(`API listening on port ${env.PORT}`);
  });
}

void main().catch((err) => {
  console.error('MongoDB connection error:', err instanceof Error ? err.message : String(err));
  process.exit(1);
});
