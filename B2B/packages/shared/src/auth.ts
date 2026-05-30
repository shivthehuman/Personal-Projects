import { z } from "zod";
import { geoJsonPointSchema } from "./geo.js";
import { orgTypeSchema, userRoleSchema } from "./enums.js";

export const organizationInputSchema = z
  .object({
    legalName: z.string().trim().min(1).max(200),
    type: orgTypeSchema,
    /** Required for MVP organizations so geospatial indexing is populated. */
    location: geoJsonPointSchema,
    addressLine1: z.string().trim().max(300).optional(),
    addressLine2: z.string().trim().max(300).optional(),
    city: z.string().trim().max(120).optional(),
    state: z.string().trim().max(120).optional(),
    postalCode: z.string().trim().max(24).optional(),
    countryCode: z.string().trim().length(2).optional(),
    phone: z.string().trim().max(20).optional(),
    email: z.string().trim().email().max(120).optional(),
  })
  .strict();

export const verificationDocumentSchema = z.object({ docType: z.string().trim(), url: z.string().url(), status: z.enum(["Pending", "Accepted", "Rejected"]) }).strict();

export const organizationOutputSchema = organizationInputSchema.extend({
  gstin: z.string().trim().max(15).optional(),
  businessType: z.string().trim().max(60).optional(),
  verificationStatus: z.enum(["Pending", "Verified", "Rejected"]).optional(),
  verificationDocuments: z.array(verificationDocumentSchema).optional(),
  trustScore: z.number().int().min(0).optional(),
});

export const registerSchema = z
  .object({
    email: z.string().trim().email().max(254),
    password: z.string().min(10).max(128),
    role: userRoleSchema,
    organization: organizationInputSchema,
  })
  .strict()
  .superRefine((val, ctx) => {
    if (val.role === "admin") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["role"],
        message: "Admin accounts cannot be created via self-service registration.",
      });
    }
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z
  .object({
    email: z.string().trim().email().max(254),
    password: z.string().min(1).max(128),
  })
  .strict();

export type LoginInput = z.infer<typeof loginSchema>;

/** Refresh rotates via httpOnly cookie; body must still be `{}` with `application/json`. */
export const refreshSchema = z.object({}).strict();

export const logoutSchema = z.object({}).strict();
