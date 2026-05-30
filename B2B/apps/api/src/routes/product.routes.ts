import { Router } from "express";
import { productSchema } from "@b2b/shared";

import type { AppEnv } from "../config/env.js";
import { asyncHandler } from "../lib/async-handler.js";
import { NotFoundError, ValidationError } from "../lib/errors.js";
import { Organization } from "../models/organization.model.js";
import { Product } from "../models/product.model.js";
import { requireAccessToken as requireAuth } from "../middleware/require-access-token.js";
import { requireRole } from "../middleware/require-role.js";
import { cacheMiddleware } from "../middleware/cache.js";
import { delCachedPattern } from "../lib/redis-client.js";

function parseFiniteNumber(value: unknown, fieldName: string): number {
    const parsed = typeof value === "string" ? Number(value) : value;

    if (typeof parsed !== "number" || !Number.isFinite(parsed)) {
        throw new ValidationError({ formErrors: [], fieldErrors: { [fieldName]: [`${fieldName} must be a valid number.`] } });
    }

    return parsed;
}

export function createProductRouter(_env: AppEnv): Router {
    const router = Router();

    router.post(
        "/",
        requireAuth(_env),
        // Only sellers can create product listings
        (req, res, next) => requireRole("seller")(req, res, next),
        asyncHandler(async (req, res) => {
            if (!req.authUser) {
                throw new ValidationError({ formErrors: ["Missing authenticated user."], fieldErrors: {} });
            }

            const org = await Organization.findById(req.authUser.organizationId);
            if (!org) {
                throw new NotFoundError("Organization not found.");
            }

            const productInput = productSchema.parse({
                ...req.body,
                sellerId: req.authUser.organizationId,
                location: {
                    type: org.location.type,
                    coordinates: Array.from(org.location.coordinates),
                },
            });

            const createdProduct = await Product.create(productInput);

            res.status(201).json(createdProduct);
        })
    );

    router.get(
        "/nearby",
        asyncHandler(async (req, res) => {
            const lng = parseFiniteNumber(req.query.lng, "lng");
            const lat = parseFiniteNumber(req.query.lat, "lat");
            const rawRadius = req.query.radiusInKm;
            const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
            const category = typeof req.query.category === "string" ? req.query.category.trim() : "";

            // Pagination
            const limit = req.query.limit ? Math.max(1, Number(req.query.limit)) : 20;
            const skip = req.query.skip ? Math.max(0, Number(req.query.skip)) : 0;

            // Build pipeline: $geoNear must be first, $match for text search immediately after.
            const pipeline: any[] = [];

            const radiusNum = rawRadius === undefined ? undefined : Number(rawRadius);
            const geoNear: any = {
                near: { type: "Point", coordinates: [lng, lat] },
                distanceField: "rawDistance",
                spherical: true,
            };
            if (typeof radiusNum === "number" && Number.isFinite(radiusNum) && radiusNum > 0) {
                geoNear.maxDistance = radiusNum * 1000;
            }

            // $geoNear MUST be first
            pipeline.push({ $geoNear: geoNear });

            // $match for text search should come immediately after $geoNear
            if (q) {
                pipeline.push({
                    $match: {
                        $or: [
                            { name: { $regex: q, $options: "i" } },
                            { description: { $regex: q, $options: "i" } },
                            { category: { $regex: q, $options: "i" } },
                        ],
                    },
                });
            } else {
                // push an empty match to keep pipeline shape (explicit)
                pipeline.push({ $match: {} });
            }

            // If a category param is supplied, further filter results by category
            if (category) {
                pipeline.push({ $match: { category } });
            }

            // Populate sellerId with organization details
            pipeline.push({
                $lookup: {
                    from: "organizations",
                    localField: "sellerId",
                    foreignField: "_id",
                    as: "sellerData",
                },
            });

            pipeline.push({
                $unwind: {
                    path: "$sellerData",
                    preserveNullAndEmptyArrays: true,
                },
            });

            // Convert distance from meters to kilometers and replace sellerId with seller data
            pipeline.push({
                $addFields: {
                    distance: { $divide: ["$rawDistance", 1000] },
                    sellerId: "$sellerData",
                },
            });

            // Price range filter (optional)
            const minPrice = req.query.minPrice !== undefined ? Number(req.query.minPrice) : undefined;
            const maxPrice = req.query.maxPrice !== undefined ? Number(req.query.maxPrice) : undefined;
            if (typeof minPrice === "number" && !Number.isNaN(minPrice)) {
                pipeline.push({ $match: { pricePerUnit: { $gte: minPrice } } });
            }
            if (typeof maxPrice === "number" && !Number.isNaN(maxPrice)) {
                pipeline.push({ $match: { pricePerUnit: { $lte: maxPrice } } });
            }

            // Sort by distance (closest first)
            pipeline.push({ $sort: { distance: 1 } });

            // Remove temporary lookup/raw fields while keeping all product fields and the computed `distance` in km
            pipeline.push({ $project: { sellerData: 0, rawDistance: 0 } });

            // Pagination stages
            pipeline.push({ $skip: skip });
            pipeline.push({ $limit: limit });

            const products = await Product.aggregate(pipeline);

            res.json(products);
        })
    );

    router.get(
        "/:id",
        asyncHandler(async (req, res) => {
            const { id } = req.params;

            const product = await Product.findById(id).populate("sellerId");

            if (!product) {
                throw new NotFoundError("Product not found.");
            }

            res.json(product);
        })
    );

    // List products with optional owner filter (cached)
    router.get(
        "/",
        cacheMiddleware("products", 300), // 5 minute TTL
        asyncHandler(async (req, res) => {
            const owner = typeof req.query.owner === "string" ? req.query.owner : undefined;
            const skip = req.query.skip ? Math.max(0, Number(req.query.skip)) : 0;
            const limit = req.query.limit ? Math.max(1, Number(req.query.limit)) : 20;
            const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
            const category = typeof req.query.category === "string" ? req.query.category.trim() : "";

            const filter: any = {};
            if (owner) filter.sellerId = owner;
            if (category) filter.category = category;

            // If a search query is provided, perform a case-insensitive regex search across name/description/category
            if (q) {
                filter.$or = [
                    { name: { $regex: q, $options: "i" } },
                    { description: { $regex: q, $options: "i" } },
                    { category: { $regex: q, $options: "i" } },
                ];
            }

            const products = await Product.find(filter).skip(skip).limit(limit).populate("sellerId");
            res.json(products);
        })
    );

    // Update product (only owner/seller)
    router.patch(
        "/:id",
        requireAuth(_env),
        (req, res, next) => requireRole("seller")(req, res, next),
        asyncHandler(async (req, res) => {
            if (!req.authUser) throw new ValidationError({ formErrors: ["Missing authenticated user."], fieldErrors: {} });

            const { id } = req.params;
            const product = await Product.findById(id);
            if (!product) throw new NotFoundError("Product not found.");

            if (String(product.sellerId) !== String(req.authUser.organizationId)) {
                res.status(403).json({ message: "Forbidden" });
                return;
            }

            // apply allowed fields
            const allowed = ["name", "description", "moq", "unit", "pricePerUnit"];
            for (const key of allowed) {
                if (req.body[key] !== undefined) (product as any)[key] = req.body[key];
            }

            await product.save();

            // Invalidate product cache on update
            await delCachedPattern("products:*");

            const populated = await product.populate("sellerId");
            res.json(populated);
        })
    );

    // Delete product (only owner/seller)
    router.delete(
        "/:id",
        requireAuth(_env),
        (req, res, next) => requireRole("seller")(req, res, next),
        asyncHandler(async (req, res) => {
            if (!req.authUser) throw new ValidationError({ formErrors: ["Missing authenticated user."], fieldErrors: {} });

            const { id } = req.params;
            const product = await Product.findById(id);
            if (!product) throw new NotFoundError("Product not found.");

            if (String(product.sellerId) !== String(req.authUser.organizationId)) {
                res.status(403).json({ message: "Forbidden" });
                return;
            }

            await product.deleteOne();

            // Invalidate product cache on delete
            await delCachedPattern("products:*");

            res.status(204).end();
        })
    );

    return router;
}
