# AGENTS.md

本文件为 AI 助手提供在本仓库中工作的指引。详细文档见 [`docs/`](./docs/README.md)。

## Project Overview

UGC level platform inspired by Angry Birds — designers create levels, admins review them, players play and rate published levels. The runtime backend is a **Scala/http4s monolith** under `backend/microservice/src/`. The frontend is **React + Vite** under `frontend/src/`. Old Node.js/Express backend (`src/backend`) has been removed.

## Commands

```bash
# Install dependencies
npm install

# Start both Scala backend + Vite frontend concurrently
npm run dev

# Start backend only (port 3000, via sbt)
npm run dev:backend          # sbt run (default in-memory)
npm run dev:backend:watch    # sbt ~run
npm run dev:backend:postgres # UGC_DATABASE_MODE=jdbc sbt run

# PostgreSQL (optional persistence)
npm run postgres:up          # docker compose up -d postgres
npm run dev:postgres         # postgres + jdbc backend + frontend

# Start frontend only (port 5173, proxies API to backend)
npm run dev:frontend

# Type check frontend (no emit)
npm run check

# Frontend production build
npm run build

# Frontend tests (Node.js built-in test runner)
npm test

# Run a single test file
node --import tsx --test frontend/src/api/proxy-coverage.test.ts

# Scala compile / test
sbt compile
sbt test
sbt "testOnly *JdbcSmokeSuite"   # 需 UGC_DATABASE_MODE=jdbc + Postgres
```

## Architecture

### Source Layout

```
backend/microservice/src/     # Scala/http4s backend (sole runtime backend)
├── Main.scala
├── routes/                   # ApiRouter, HealthRouter
├── infrastructure/           # APIMessage, DatabaseSession, HttpError, AuthMiddleware
├── core/                     # AccessControl, RowMappers, InMemoryStore
├── system/                   # Health, enums, seed data
├── user/                     # Identity, bind, profile, AccessControl, UserTable
├── level/                    # Level CRUD, submissions, player actions
├── admin/                    # Review, comments, director features
├── ui/                       # UI customization (director only)
├── bird/                     # Bird design & review
└── player/                   # Shop, social, preparation, UI runtime

frontend/src/
├── api/                      # One API per file; Zod-validated requests
├── objects/                  # Zod schemas aligned with Scala objects
├── page/                     # Page entries (pathname routing in App.tsx)
├── component/                # Shared UI and business components
├── hook/                     # React hooks (incl. designer-page/)
├── lib/                      # Auth, config, game-engine, UI runtime
├── store/                    # Lightweight client state
├── App.tsx                   # Pathname-based routing, auth session
└── main.tsx

docs/                         # Architecture, status, roadmap
scripts/dev.mjs               # Concurrent sbt + vite launcher
```

### API Contract Pattern

- **Frontend**: `frontend/src/api/<module>/*Api.ts` calls `client.request(path, init, zodSchema)`; schemas live in `frontend/src/objects/<module>/`
- **Backend**: `backend/microservice/src/<module>/api/*Api.scala` defines `XxxAPIMessage` with `plan(connection): IO[Either[HttpError, A]]`
- **Naming**: Frontend and backend API filenames match one-to-one (e.g. `CreateLevelApi`)
- **Response shape**: `{ success: true, data }` / `{ success: false, error: { code, message } }`

### Backend Patterns

- **Route → APIMessage → Table**: Routes parse HTTP (path/header/body), construct APIMessage, call `.run(databaseSession)` — routes must not call `withTransaction` or services directly
- **Auth**: `AuthMiddleware.requireUserId` wraps protected routes in `ApiRouter`; public routes are `/health` and `/auth/*`. Handlers read identity via `AuthMiddleware.userIdFromRequest(req)`. Role checks use `AccessControl.requireRole` / `requireAdminLevel` inside APIMessage `plan`
- **Transactions**: `APIMessage.run` → `DatabaseSession.withTransactionEither` — `Right` commits, `Left` rolls back (no exception-driven rollback)
- **Storage**: Default `DatabaseSession.inMemory`; optional JDBC via `UGC_DATABASE_MODE=jdbc` + PostgreSQL (`backend/docker/init-store.sql`, `npm run postgres:up`)
- **Admin levels**: `AdminLevel.Standard` (review, comments) vs `AdminLevel.Director` (UI customization, level slots, bird skills)

### Frontend Patterns

- **No router library**: `App.tsx` uses `window.location.pathname` + `history.pushState`
- **API client**: `frontend/src/api/client.ts`
- **Game engine**: Matter.js in `frontend/src/lib/game-engine/`
- **Auth**: Mock auth in localStorage; users bind via `user` module `BindBackendUserApi` (`POST /auth/bind`)
- **Complex page example**: `page/DesignerPage/` split into hooks, components, lib, objects — see `page/DesignerPage/ARCHITECTURE.md`

### Key TypeScript Config

- `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`
- Module: `NodeNext` with `.js` extensions in imports
- ESM project (`"type": "module"` in package.json)
- `include` scoped to `frontend/src/**`

### Vite Proxy

Frontend dev server proxies these paths to `localhost:3000`:
`/health`, `/auth`, `/users`, `/designer/levels`, `/designer/submissions`, `/designer/bird-designs`, `/admin/comments`, `/admin/director`, `/admin/submissions`, `/admin/bird-submissions`, `/player/levels`, `/player/favorites`, `/player/ui`, `/player/social`, `/player/preparation`

New API paths must be added to `vite.config.ts` proxy list.
