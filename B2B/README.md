# 🌿 B2B Hyperlocal & National Marketplace

This repository contains a full-stack B2B marketplace monorepo with a geospatial discovery experience focused on hyperlocal wholesale buying, plus national discovery.

Contents:
- `apps/api` — Express + TypeScript backend and API server
- `apps/web` — Vite + React TypeScript frontend (PWA-ready)
- `packages/shared` — shared Zod schemas and TypeScript types

The project is intended for local development and MVP validation. Keep secrets (`.env`) local and do not commit them.

## 🚀 Core Features

### 🌍 Intelligent Geospatial Search
- **Smart Proximity Routing:** Uses MongoDB `$geoNear` to compute distances and sort results by proximity.
- **National Discovery:** Supports both local and nationwide discovery with query-driven radius control.
- **URL-driven discovery:** Canonical search state is stored in URL params (`?q=` and `?category=`) for deep-linking and reproducible searches.

### 🔐 Auth & Onboarding
- **Multi-step onboarding:** OTP + role selection and business details capture.
- **Security:** JWT-based session management, short-lived access tokens, and hashed refresh tokens.

### 📦 Seller Inventory Console
- Dedicated Seller Dashboard and Inventory page with full CRUD for product listings and stock levels.
- Stock is decremented on order placement; order lifecycle follows: `Pending -> Accepted -> Packed -> Delivered`.

### 🛒 End-to-End Order Engine
* **Transaction Flow:** Buyers can place orders with automated Minimum Order Quantity (MOQ) and Total Price calculations.
* **Dual Dashboards:** Order history supports "Buyer View" (My Purchases) and "Seller View" (My Sales) with status tracking (Pending, Shipped, Delivered).

### 🎨 UI/UX & Architecture
- Simple, responsive design with Tailwind CSS and accessible components.
- Pagination and server-side filtering keep client performance smooth for large datasets.
- PWA-ready: service worker and push subscription scaffolding included.

---

## 💻 Tech Stack

**Frontend (apps/web):**
* React 18 + Vite
* TypeScript
* Tailwind CSS
* React Router DOM
* Google Maps API Integration

**Backend (apps/api):**
* Node.js + Express
* TypeScript
* MongoDB + Mongoose (2dsphere indexes for location data)
* JSON Web Tokens (JWT) & bcrypt

---

## 🗄️ Database Architecture (Key Models)

1. **User Model:** Manages authentication, onboarding progress, and role assignment.
2. **Organization Model:** Stores GeoJSON coordinates (`type: "Point"`), legal business details, and verification status.
3. **Product Model:** Tracks item metadata, price, unit, MOQ, and is heavily indexed for text and location searches.
4. **Order Model:** The transactional bridge linking `buyerId`, `sellerId`, `productId`, `quantity`, and fulfillment `status`.

---

## 🛠️ Quick Start (local development)

1. Install dependencies at the repo root:

```bash
npm install
```

2. Provide local environment variables (create a `.env` in the repo root). Example keys the API expects:

```
MONGO_URI=your-mongo-connection-string
JWT_ACCESS_SECRET=your_32_char_secret
JWT_REFRESH_PEPPER=your_32_char_pepper
VITE_VAPID_PUBLIC_KEY=your_vapid_public_key
VITE_GOOGLE_MAPS_API_KEY=your_maps_key
```

3. Start local services (optional: uses Docker for MongoDB):

```bash
docker compose up -d
npm run dev
```

4. REST smoke tests can be exercised via `test-api.http` (VS Code REST Client) or the SPA.

Notes:
- Do not commit `.env` or any secrets to the repository.
- For production deployment, build scripts are available in each package (`apps/api` and `apps/web`).
