# CODEBUDDY.md

This file provides guidance to CodeBuddy Code when working with code in this repository.

## Project Overview

UGC level platform inspired by Angry Birds — designers create levels, admins review them, players play and rate published levels. Based on proposal.txt. Also includes a Scala microservice (http4s + cats-effect + PostgreSQL) under `src/main/scala/`.

## Commands

```bash
# Install dependencies
npm install

# Start both backend + frontend concurrently
npm run dev

# Start backend only (port 3000)
npm run dev:backend          # one-shot
npm run dev:backend:watch    # watch mode with tsx

# Start frontend only (port 5173, proxies API to backend)
npm run dev:frontend

# Type check (no emit)
npm run check

# Production build (tsc + vite)
npm run build

# Run tests (Node.js built-in test runner)
npm test

# Run a single test file
node --import tsx --test src/backend/services/lifecycle.test.ts
```

Scala microservice (requires sbt):
```bash
sbt run
```

## Architecture

### Source Layout

```
src/
├── shared/           # Single source of truth for API contracts
│   ├── schemas/      # Zod schemas (common, level, submission, rating, comment, favorite, user, api)
│   ├── api/          # Per-role request/response schemas (auth, user, designer, admin, player)
│   ├── levels/       # Starter level data
│   └── types.ts      # Re-exports everything — frontend and backend import from here
├── backend/
│   ├── server.ts     # Entry point (listens on 127.0.0.1:3000)
│   ├── app.ts        # Express app setup: middleware, route mounting, error handling
│   ├── middleware/    # authenticate (x-user-id header), requireRole
│   ├── routes/       # Route handlers: parse input → call service → validate response → send
│   ├── services/     # Business logic (no Express dependency)
│   ├── data/store.ts # In-memory JSON file store (data/backend-store.json), resets in test env
│   └── lib/http.ts   # HttpError, parseOrThrow (Zod→400), success/errorResponse helpers
├── frontend/
│   ├── main.tsx      # React entry
│   ├── App.tsx       # Minimal pathname-based routing (no router library)
│   ├── pages/        # Page components (DesignerPage with hooks/components sub-structure)
│   ├── components/   # Shared UI components (RoleSwitcher, game canvas, auth, designer editor)
│   ├── game/         # Matter.js physics engine, fracture model, game session, drawing
│   ├── lib/          # API client, auth, config, level repository, terrain helpers
│   │   └── api/      # Per-role API modules using shared response schemas for validation
│   └── styles.css
└── main/scala/       # Scala microservice (http4s, separate from Node backend)
```

### Shared Schema Contract

The core architectural pattern: **Zod schemas in `src/shared/schemas/` define all API contracts**, and TypeScript types are inferred from them (never hand-written separately).

- `src/shared/types.ts` re-exports everything — both frontend and backend import from this single entry point
- `src/shared/api/` organizes per-role request/response schemas that compose from the base schemas
- Frontend validates API responses before rendering; backend validates requests before processing and responses before sending
- This gives compile-time type safety + runtime validation at both boundaries

### Backend Patterns

- **Route → Service → Store**: Routes parse/validate with `parseOrThrow(schema, input)`, call service methods, validate response with `parseOrThrow(responseSchema, result)`, return via `success(data)` or `HttpError`
- **Auth**: `x-user-id` header → `authenticate` middleware → `req.currentUser` → `requireRole("designer")` for role-gated routes
- **Store**: In-memory arrays persisted to `data/backend-store.json`. Test environment uses default state without file I/O. Call `saveStore()` after mutations.
- **Error handling**: All errors flow through `HttpError` → centralized error middleware → structured `{ success: false, error: { code, message } }`

### Frontend Patterns

- **No router library**: `App.tsx` uses `window.location.pathname` with `history.pushState` for navigation
- **API client**: `src/frontend/lib/api/client.ts` — `request(path, init, responseSchema)` validates responses with Zod
- **Game engine**: Matter.js-based physics in `src/frontend/game/`, with `GameSession` managing engine lifecycle
- **Auth**: Mock auth with localStorage persistence; frontend-registered users bind to backend demo accounts (`player-1`, `designer-1`, `admin-1`)

### Key TypeScript Config

- `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`
- Module: `NodeNext` with `.js` extensions in imports
- ESM project (`"type": "module"` in package.json)

### Vite Proxy

Frontend dev server proxies these paths to backend at `localhost:3000`:
`/health`, `/users`, `/designer/levels`, `/designer/submissions`, `/admin/comments`, `/admin/submissions`, `/player/levels`, `/player/favorites`
