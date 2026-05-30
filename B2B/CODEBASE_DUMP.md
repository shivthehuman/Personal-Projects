# Codebase Dump

Generated for reference.

Date: 2026-05-17

---

## 1) Complete folder & file structure

```
c:\B2B\.gitignore
c:\B2B\test-api.http
c:\B2B\README.md
c:\B2B\packages\shared\tsconfig.json
c:\B2B\packages\shared\src\push.ts
c:\B2B\packages\shared\src\product.ts
c:\B2B\packages\shared\src\index.ts
c:\B2B\packages\shared\src\geo.ts
c:\B2B\packages\shared\src\enums.ts
c:\B2B\packages\shared\src\auth.ts
c:\B2B\packages\shared\README.md
c:\B2B\packages\shared\package.json
c:\B2B\package.json
c:\B2B\package-lock.json
c:\B2B\docker-compose.yml
c:\B2B\AGENTS.md
c:\B2B\apps\web\vite.config.ts
c:\B2B\apps\web\tsconfig.node.json
c:\B2B\apps\web\tsconfig.json
c:\B2B\apps\web\tsconfig.app.json
c:\B2B\apps\web\tailwind.config.js
c:\B2B\apps\web\src\vite-env.d.ts
c:\B2B\apps\web\src\router.tsx
c:\B2B\apps\web\src\providers\AppProviders.tsx
c:\B2B\apps\web\src\pages\SellerDashboard.tsx
c:\B2B\apps\web\src\pages\RegisterPage.tsx
c:\B2B\apps\web\src\pages\ProfilePage.tsx
c:\B2B\apps\web\src\pages\ProductDetailsPage.tsx
c:\B2B\apps\web\src\pages\OrdersPage.tsx
c:\B2B\apps\web\src\pages\OnboardingPage.tsx
c:\B2B\apps\web\src\pages\LoginPage.tsx
c:\B2B\apps\web\src\pages\InventoryPage.tsx
c:\B2B\apps\web\src\pages\DashboardPage.tsx
c:\B2B\apps\web\src\pages\CheckoutPage.tsx
c:\B2B\apps\web\src\pages\CartPage.tsx
c:\B2B\apps\web\src\pages\BuyerDashboard.tsx
c:\B2B\apps\web\src\main.tsx
c:\B2B\apps\web\README.md
c:\B2B\apps\web\index.html
c:\B2B\apps\web\package.json
c:\B2B\apps\web\postcss.config.js
c:\B2B\apps\web\src\index.css
c:\B2B\apps\web\src\layouts\SidebarLayout.tsx
c:\B2B\apps\web\src\layouts\ProtectedLayout.tsx
c:\B2B\apps\web\src\api\orders.ts
c:\B2B\apps\web\src\api\onboarding.ts
c:\B2B\apps\web\src\api\http.ts
c:\B2B\apps\web\src\api\auth.api.ts
c:\B2B\apps\web\src\api\profile.api.ts
c:\B2B\apps\web\src\api\products.ts
c:\B2B\apps\web\src\api\session.ts
c:\B2B\apps\web\src\components\ProductForm.tsx
c:\B2B\apps\web\src\components\ProductCard.tsx
c:\B2B\apps\web\src\components\MapModal.tsx
c:\B2B\apps\web\src\components\Layout.tsx
c:\B2B\apps\web\src\components\ErrorBoundary.tsx
c:\B2B\apps\api\README.md
c:\B2B\apps\api\package.json
c:\B2B\apps\api\tsconfig.json
c:\B2B\apps\web\src\contexts\CartContext.tsx
c:\B2B\apps\web\public\pwa-maskable.svg
c:\B2B\apps\api\src\config\env.ts
c:\B2B\apps\api\src\controllers\auth.controller.ts
c:\B2B\apps\api\src\controllers\push.controller.ts
c:\B2B\apps\api\src\index.ts
c:\B2B\apps\api\src\controllers\users.controller.ts
c:\B2B\apps\api\src\types\multer.d.ts
c:\B2B\apps\api\src\types\express.d.ts
c:\B2B\apps\web\src\lib\token-store.ts
c:\B2B\apps\web\src\lib\push-encoding.ts
c:\B2B\apps\web\src\lib\errors.ts
c:\B2B\apps\web\src\lib\env.ts
c:\B2B\apps\api\src\lib\errors.ts
c:\B2B\apps\api\src\lib\crypto-tokens.ts
c:\B2B\apps\api\src\lib\cookies.ts
c:\B2B\apps\api\src\lib\async-handler.ts
c:\B2B\apps\api\src\lib\password.ts
c:\B2B\apps\api\src\lib\jwt-access.ts
c:\B2B\apps\api\src\lib\redis-client.ts
c:\B2B\apps\api\src\models\order.model.ts
c:\B2B\apps\api\src\services\auth.service.ts
c:\B2B\apps\api\src\seed.ts
c:\B2B\apps\api\src\models\product.model.ts
c:\B2B\apps\api\src\models\organization.model.ts
c:\B2B\apps\api\src\models\push-subscription.model.ts
c:\B2B\apps\api\src\models\refresh-token.model.ts
c:\B2B\apps\api\src\models\user.model.ts
c:\B2B\apps\api\src\routes\auth.router.ts
c:\B2B\apps\api\src\routes\order.routes.ts
c:\B2B\apps\api\src\routes\organizations.router.ts
c:\B2B\apps\api\src\routes\product.routes.ts
c:\B2B\apps\api\src\routes\users.router.ts
c:\B2B\apps\api\src\routes\push.router.ts
c:\B2B\apps\api\src\db\connect.ts
c:\B2B\apps\api\src\middleware\rate-limit.ts
c:\B2B\apps\api\src\middleware\http-error-handler.ts
c:\B2B\apps\api\src\middleware\cache.ts
c:\B2B\apps\api\src\middleware\require-access-token.ts
c:\B2B\apps\api\src\middleware\require-role.ts
c:\B2B\apps\api\src\middleware\validate-body.ts
```

---

## 2) Raw Mongoose schemas in `apps/api/src/models`

### `apps/api/src/models/order.model.ts`

```ts
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
```

### `apps/api/src/models/product.model.ts`

```ts
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
```

### `apps/api/src/models/organization.model.ts`

```ts
import mongoose, { Schema, type InferSchemaType, type HydratedDocument, type Model } from "mongoose";
import type { OrgType } from "@b2b/shared";

const orgTypeValues = ["buyer", "seller", "transporter", "other"] satisfies readonly OrgType[];

const organizationSchema = new Schema(
  {
    legalName: { type: String, required: true, trim: true, maxlength: 200 },
    orgType: { type: String, required: true, enum: orgTypeValues },
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
    addressLine1: { type: String, trim: true, maxlength: 300 },
    addressLine2: { type: String, trim: true, maxlength: 300 },
    city: { type: String, trim: true, maxlength: 120 },
    state: { type: String, trim: true, maxlength: 120 },
    postalCode: { type: String, trim: true, maxlength: 24 },
    countryCode: { type: String, trim: true, uppercase: true, maxlength: 2 },
    phone: { type: String, trim: true, maxlength: 20 },
    email: { type: String, trim: true, lowercase: true, maxlength: 120 },
    gstin: { type: String, trim: true, uppercase: true, maxlength: 15 },
    businessType: { type: String, trim: true, maxlength: 60 },
    verificationStatus: { type: String, enum: ["Pending", "Verified", "Rejected"], default: "Pending" },
    verificationDocuments: [
      {
        type: {
          docType: { type: String, required: true },
          url: { type: String, required: true },
          status: { type: String, enum: ["Pending", "Accepted", "Rejected"], default: "Pending" },
        },
        _id: false,
      },
    ],
    trustScore: { type: Number, default: 0 },
  },
  { timestamps: true }
);

organizationSchema.index({ legalName: 1 });
organizationSchema.index({ location: "2dsphere" });

export type OrganizationDoc = HydratedDocument<InferSchemaType<typeof organizationSchema>>;
export type OrganizationModel = Model<InferSchemaType<typeof organizationSchema>>;
export const Organization = mongoose.models.Organization ?? mongoose.model("Organization", organizationSchema);
```

### `apps/api/src/models/push-subscription.model.ts`

```ts
import mongoose, { Schema, type InferSchemaType, type HydratedDocument, type Model } from "mongoose";

const pushKeysSchema = new Schema(
  {
    p256dh: { type: String, required: true },
    auth: { type: String, required: true },
  },
  { _id: false }
);

const pushSubscriptionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    endpoint: { type: String, required: true, trim: true, maxlength: 4096 },
    keys: { type: pushKeysSchema, required: true },
    userAgent: { type: String, trim: true, maxlength: 512 },
  },
  { timestamps: true }
);

pushSubscriptionSchema.index({ userId: 1, endpoint: 1 }, { unique: true });

export type PushSubscriptionDoc = HydratedDocument<InferSchemaType<typeof pushSubscriptionSchema>>;
export type PushSubscriptionModel = Model<InferSchemaType<typeof pushSubscriptionSchema>>;
export const PushSubscription =
  mongoose.models.PushSubscription ?? mongoose.model("PushSubscription", pushSubscriptionSchema);
```

### `apps/api/src/models/refresh-token.model.ts`

```ts
import mongoose, { Schema, type InferSchemaType, type HydratedDocument, type Model } from "mongoose";

const refreshTokenSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    hashedToken: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type RefreshTokenDoc = HydratedDocument<InferSchemaType<typeof refreshTokenSchema>>;
export type RefreshTokenModel = Model<InferSchemaType<typeof refreshTokenSchema>>;
export const RefreshToken =
  mongoose.models.RefreshToken ?? mongoose.model("RefreshToken", refreshTokenSchema);
```

### `apps/api/src/models/user.model.ts`

```ts
import mongoose, { Schema, type InferSchemaType, type HydratedDocument, type Model } from "mongoose";
import type { UserRole } from "@b2b/shared";

const userRoleValues = ["buyer", "seller", "transporter", "admin"] satisfies readonly UserRole[];

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      required: true,
      enum: userRoleValues,
      index: true,
    },
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
    onboardingStep: { type: Number, default: 0 },
    isProfileComplete: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export type UserDoc = HydratedDocument<InferSchemaType<typeof userSchema>>;
export type UserModel = Model<InferSchemaType<typeof userSchema>>;
export const User = mongoose.models.User ?? mongoose.model("User", userSchema);
```

---

## 3) Exact `package.json` files & dependencies

### Root `package.json`

```json
{
  "name": "b2b",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "concurrently -n web,api -c blue,green \"npm run dev -w @b2b/web\" \"npm run dev -w @b2b/api\""
  },
  "devDependencies": {
    "concurrently": "^9.1.2",
    "typescript": "~5.7.3"
  }
}
```

### `apps/api/package.json`

```json
{
  "name": "@b2b/api",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "seed": "tsx src/seed.ts",
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@b2b/shared": "*",
    "@types/multer": "^2.1.0",
    "bcryptjs": "^2.4.3",
    "cookie-parser": "^1.4.7",
    "cors": "^2.8.5",
    "dotenv": "^16.6.1",
    "express": "^4.21.2",
    "express-rate-limit": "^7.1.5",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.17.2",
    "multer": "^2.1.1",
    "redis": "^4.6.12",
    "zod": "^3.24.2"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/cookie-parser": "^1.4.10",
    "@types/cors": "^2.8.19",
    "@types/express": "^4.17.21",
    "@types/jsonwebtoken": "^9.0.10",
    "@types/node": "^22.10.10",
    "tsx": "^4.19.2",
    "typescript": "~5.7.3"
  }
}
```

### `apps/web/package.json`

```json
{
  "name": "@b2b/web",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@b2b/shared": "*",
    "@react-google-maps/api": "^2.20.8",
    "@tanstack/react-query": "^5.67.4",
    "@types/leaflet": "^1.9.21",
    "axios": "^1.8.1",
    "leaflet": "^1.9.4",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-leaflet": "^4.2.1",
    "react-router-dom": "^6.28.2"
  },
  "devDependencies": {
    "@types/react": "^18.3.18",
    "@types/react-dom": "^18.3.5",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.5.0",
    "postcss": "^8.5.14",
    "tailwindcss": "^3.4.19",
    "typescript": "~5.7.3",
    "vite": "^6.0.6",
    "vite-plugin-pwa": "^0.21.1"
  }
}
```

### `packages/shared/package.json`

```json
{
  "name": "@b2b/shared",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": "./src/index.ts",
  "dependencies": {
    "zod": "^3.24.2"
  },
  "devDependencies": {
    "typescript": "~5.7.3"
  }
}
```

---

If you want the dump in a different format (ZIP, full file contents for entire repo, or JSON tree), tell me which format and I'll generate it.
