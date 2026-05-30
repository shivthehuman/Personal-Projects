import { z } from "zod";

export { z };

export const sharedPackageName = "@b2b/shared" as const;

/** Health check payloads for tooling */
export const healthPingSchema = z.object({ ok: z.literal(true) });

export * from "./enums.js";
export * from "./geo.js";
export * from "./auth.js";
export * from "./push.js";
export * from "./product.js";
