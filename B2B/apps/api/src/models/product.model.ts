import mongoose, { Schema, type HydratedDocument, type InferSchemaType, type Model } from "mongoose";

const productDocumentSchema = new Schema(
    {
        title: { type: String, required: true, trim: true, maxlength: 200 },
        url: { type: String, required: true, trim: true, maxlength: 2048 },
    },
    { _id: false }
);

const productSchema = new Schema(
    {
        sellerId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
        name: { type: String, required: true, trim: true, maxlength: 200 },
        description: { type: String, required: true, trim: true, maxlength: 5000 },
        moq: { type: Number, required: true, min: 1 },
        unit: { type: String, required: true, trim: true, maxlength: 50 },
        pricePerUnit: { type: Number, required: true },
        stock: { type: Number, required: true, default: 0, min: 0 },
        documents: { type: [productDocumentSchema], default: undefined },
        location: {
            type: {
                type: String,
                enum: ["Point"],
                required: true,
            },
            coordinates: {
                type: [Number],
                required: true,
                validate: {
                    validator: (coords: unknown) => Array.isArray(coords) && coords.length === 2,
                    message: "Coordinates must be [lng, lat]",
                },
            },
            _id: false,
        },
    },
    { timestamps: true }
);

productSchema.index({ location: "2dsphere" });

export type ProductDoc = HydratedDocument<InferSchemaType<typeof productSchema>>;
export type ProductModel = Model<InferSchemaType<typeof productSchema>>;
export const Product = mongoose.models.Product ?? mongoose.model("Product", productSchema);
