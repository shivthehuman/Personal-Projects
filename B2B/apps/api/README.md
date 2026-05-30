# API — apps/api

This folder contains the Express + TypeScript backend for the B2B platform.

Quickstart (inside repo root):

```bash
cd apps/api
npm install
npm run build    # compile TypeScript to dist
npm start        # runs built server (requires env vars)
```

During development use the root `npm run dev` to run both API and web simultaneously.

Important env vars (see `apps/api/src/config/env.ts`):
- `MONGO_URI` — MongoDB connection string
- `JWT_ACCESS_SECRET` — access token signing secret (32+ chars)
- `JWT_REFRESH_PEPPER` — refresh token pepper (32+ chars)

Keep `.env` out of source control.
