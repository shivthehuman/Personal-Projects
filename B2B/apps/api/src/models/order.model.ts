import mongoose, { Schema, type HydratedDocument, type InferSchemaType, type Model } from "mongoose";

const orderStatusValues = ["Pending", "Accepted", "Packed", "Delivered"] as const;

const orderSchema = new Schema(
    {
        buyerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
        sellerId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
        productId: { type: Schema.Types.ObjectId, ref: "Product", required: true, index: true },
        quantity: { type: Number, required: true, min: 1 },
        totalAmount: { type: Number, required: true, min: 0 },
        status: { type: String, enum: orderStatusValues, default: "Pending", required: true, index: true },
    },
    { timestamps: { createdAt: true, updatedAt: false } }
);

orderSchema.index({ buyerId: 1, createdAt: -1 });
orderSchema.index({ sellerId: 1, createdAt: -1 });

export type OrderDoc = HydratedDocument<InferSchemaType<typeof orderSchema>>;
export type OrderModel = Model<InferSchemaType<typeof orderSchema>>;
export const Order = mongoose.models.Order ?? mongoose.model("Order", orderSchema);
