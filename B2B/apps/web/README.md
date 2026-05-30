# Web — apps/web

Frontend SPA built with Vite, React, and TypeScript.

Run locally (from repo root):

```bash
cd apps/web
npm install
npm run dev
```

Environment variables (Vite):
- `VITE_API_ORIGIN` — API base URL (defaults to `/api`)
- `VITE_VAPID_PUBLIC_KEY` — optional Web Push VAPID public key
- `VITE_GOOGLE_MAPS_API_KEY` — optional Google Maps API key for map modal

Build for production:

```bash
npm run build
```
