import { Router } from "express";

import type { AppEnv } from "../config/env.js";
import { asyncHandler } from "../lib/async-handler.js";
import { NotFoundError, ValidationError } from "../lib/errors.js";
import { Product } from "../models/product.model.js";
import { Order } from "../models/order.model.js";
import { requireAccessToken } from "../middleware/require-access-token.js";
import { orderLimiter } from "../middleware/rate-limit.js";

export function createOrderRouter(env: AppEnv): Router {
    const router = Router();

    router.post(
        "/",
        requireAccessToken(env),
        orderLimiter,
        asyncHandler(async (req, res) => {
            if (!req.authUser) {
                throw new ValidationError({ formErrors: ["Missing authenticated user."], fieldErrors: {} });
            }

            const { productId, quantity } = req.body as { productId?: string; quantity?: number };
            if (!productId || typeof productId !== "string") {
                throw new ValidationError({ formErrors: [], fieldErrors: { productId: ["productId is required."] } });
            }
            if (typeof quantity !== "number" || !Number.isFinite(quantity) || quantity < 1) {
                throw new ValidationError({ formErrors: [], fieldErrors: { quantity: ["quantity must be at least 1."] } });
            }

            const product = await Product.findById(productId).exec();
            if (!product) throw new NotFoundError("Product not found.");

            // Check if stock is available
            if ((product.stock ?? 0) < quantity) {
                throw new ValidationError({
                    formErrors: [],
                    fieldErrors: { quantity: [`Insufficient stock. Available: ${product.stock ?? 0}. Requested: ${quantity}`] }
                });
            }

            const totalAmount = Number(product.pricePerUnit) * quantity;

            // Create order and deduct stock in one transaction
            const order = await Order.create({
                buyerId: req.authUser.id,
                sellerId: product.sellerId,
                productId: product._id,
                quantity,
                totalAmount,
                status: "Pending",
            });

            // Deduct stock immediately after order creation
            await Product.findByIdAndUpdate(productId, {
                $inc: { stock: -quantity }
            }).exec();

            const created = await Order.findById(order._id)
                .populate("productId")
                .populate("sellerId")
                .populate("buyerId", "email role")
                .exec();

            res.status(201).json(created ?? order);
        })
    );

    router.get(
        "/",
        requireAccessToken(env),
        asyncHandler(async (req, res) => {
            if (!req.authUser) {
                throw new ValidationError({ formErrors: ["Missing authenticated user."], fieldErrors: {} });
            }

            const view = typeof req.query.view === "string" ? req.query.view : "buyer";
            const filter: Record<string, unknown> =
                view === "seller"
                    ? { sellerId: req.authUser.organizationId }
                    : { buyerId: req.authUser.id };

            const orders = await Order.find(filter)
                .sort({ createdAt: -1 })
                .populate("productId")
                .populate("sellerId")
                .populate("buyerId", "email role")
                .exec();

            res.json(orders);
        })
    );

    router.patch(
        "/:id/status",
        requireAccessToken(env),
        asyncHandler(async (req, res) => {
            if (!req.authUser) {
                throw new ValidationError({ formErrors: ["Missing authenticated user."], fieldErrors: {} });
            }

            const { id } = req.params;
            const { status } = req.body as { status?: string };

            if (!status || typeof status !== "string") {
                throw new ValidationError({ formErrors: [], fieldErrors: { status: ["status is required and must be a string."] } });
            }

            const validStatuses = ["Pending", "Accepted", "Packed", "Delivered"];
            if (!validStatuses.includes(status)) {
                throw new ValidationError({
                    formErrors: [],
                    fieldErrors: { status: [`Invalid status. Must be one of: ${validStatuses.join(", ")}`] }
                });
            }

            const order = await Order.findById(id).exec();
            if (!order) throw new NotFoundError("Order not found.");

            // Verify seller owns this order
            if (order.sellerId.toString() !== req.authUser.organizationId?.toString()) {
                throw new ValidationError({ formErrors: ["You can only update your own orders."], fieldErrors: {} });
            }

            // Update status
            order.status = status as "Pending" | "Accepted" | "Packed" | "Delivered";
            await order.save();

            const updated = await Order.findById(order._id)
                .populate("productId")
                .populate("sellerId")
                .populate("buyerId", "email role")
                .exec();

            res.json(updated ?? order);
        })
    );

    return router;
}
