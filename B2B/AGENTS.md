# Agent Guidance for this Repository

Purpose: give AI coding agents and contributors clear, minimal, actionable instructions for working in this monorepo.

Quickstart
- **Prereqs:** Node 20+; Docker for local MongoDB. See [README.md](README.md).
- **Dev:** `npm install` at repo root, `docker compose up -d` (optional), then `npm run dev` (root) — runs both web and api in parallel. See [package.json](package.json) and [docker-compose.yml](docker-compose.yml).

Important scripts (link targets)
- Root dev: [package.json](package.json)
- API dev/build/start: [apps/api/package.json](apps/api/package.json) and entry [apps/api/src/index.ts](apps/api/src/index.ts)
- Web dev/build: [apps/web/package.json](apps/web/package.json) and entry [apps/web/src/main.tsx](apps/web/src/main.tsx)

Architecture (short)
- `apps/api` — Express TypeScript backend. Key files: [apps/api/src/index.ts](apps/api/src/index.ts), [apps/api/src/config/env.ts](apps/api/src/config/env.ts), middleware under [apps/api/src/middleware](apps/api/src/middleware).
- `apps/web` — Vite + React frontend. Key files: [apps/web/src/main.tsx](apps/web/src/main.tsx), [apps/web/src/lib/env.ts](apps/web/src/lib/env.ts).
- `packages/shared` — shared Zod schemas/types: [packages/shared/src/index.ts](packages/shared/src/index.ts).

Environment & secrets
- API env validation: [apps/api/src/config/env.ts](apps/api/src/config/env.ts). Required vars (e.g., `JWT_ACCESS_SECRET`) are validated at startup — missing/invalid values will prevent the server from starting.
- Web uses Vite `VITE_*` env variables: [apps/web/src/lib/env.ts](apps/web/src/lib/env.ts).

Security note:
- Never commit `.env` files or production secrets. The repo `.gitignore` includes `.env` and related patterns.
- If you need to share test credentials, use the `test-api.http` file or a secure channel — keep production credentials out of source control.

Conventions agents should follow
- Work from repo root; use workspace `npm install` to set up node_modules and workspace links.
- Run `npm run dev` for local development; use package-specific `-w` scripts when targeting one package.
- TypeScript builds: API expects `dist` output for `npm run start` — run the `build` script before `start`.
- Preserve shared types in `packages/shared` and update consumers when changing exported schemas.

Common pitfalls
- Node version mismatch (use Node 20+). See root README.
- Missing `.env` or invalid secrets — API uses Zod and will fail fast on invalid env.
- MongoDB must be running for API integration (use `docker compose up -d` or external DB).
- Prefer editing from repo root to keep workspace links correct.

Reference files (use these links when making changes)
- [README.md](README.md)
- [docker-compose.yml](docker-compose.yml)
- [test-api.http](test-api.http)
- [apps/api/src/config/env.ts](apps/api/src/config/env.ts)
- [apps/api/src/index.ts](apps/api/src/index.ts)
- [apps/api/package.json](apps/api/package.json)
- [apps/web/package.json](apps/web/package.json)
- [packages/shared/src/index.ts](packages/shared/src/index.ts)

If you want me to, I can also:
- create a specialized `agents/backend.md` and `agents/frontend.md` with deeper rules,
- add automated checks (scripts) that agents should run before proposing changes.
