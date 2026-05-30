import { z } from "zod";
import { geoJsonPointSchema } from "./geo.js";

export const productDocumentSchema = z
    .object({
        title: z.string().trim().min(1).max(200),
        url: z.string().trim().url().max(2048),
    })
    .strict();

export const productSchema = z
    .object({
        name: z.string().trim().min(1).max(200),
        description: z.string().trim().min(1).max(5000),
        moq: z.number().min(1),
        unit: z.string().trim().min(1).max(50),
        pricePerUnit: z.number(),
        sellerId: z.string().trim().min(1),
        documents: z.array(productDocumentSchema).optional(),
        location: geoJsonPointSchema,
    })
    .strict();

export type ProductInput = z.infer<typeof productSchema>;
