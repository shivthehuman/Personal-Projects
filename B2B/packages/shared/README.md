# Shared Types & Schemas — packages/shared

Small package that exports shared Zod schemas and TypeScript types used by both the API and Web clients.

Usage:

```ts
import { productSchema } from "@b2b/shared";

// use in server-side validation or on client forms
```

Build/Linking:
- This package is referenced by workspace packages; running `npm install` at the repo root sets up local links.
