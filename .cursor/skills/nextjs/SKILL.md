---
name: nextjs
description: Conventions for the Next.js App Router web app in web/. Use when adding or modifying TypeScript pages, components, or API calls in web/.
---

# Next.js (App Router) conventions

- TypeScript only. No `.js` / `.jsx` source.
- App Router under `web/app/`. Components live in `web/components/`. Shared logic in `web/lib/`.
- Pages are client components (`"use client"`) when they need auth state; keep server components pure if ever added.
- All API calls go through `lib/api.ts` (`api<T>(path, init)`), which:
  - reads the JWT from `localStorage` (`skillful.token`)
  - sets `Authorization: Bearer <token>`
  - redirects to `/login` on 401
- Tailwind v4 via `@import "tailwindcss"` in `globals.css`. Prefer zinc/emerald palette, dark theme.
- Environment: `NEXT_PUBLIC_API_BASE` in `.env.local` points at the FastAPI server (`http://127.0.0.1:8000` locally).
- Currency amounts are stored server-side in integer cents; use `lib/format.formatCents` for display.
