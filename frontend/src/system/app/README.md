# App System Layer

`system/app/` contains frontend-wide application logic that is not tied to one page or one backend API module.

## Files

- `auth.ts`: local demo auth, persisted users, backend-user binding, admin-level sync.
- `config.ts`: API base URL and built-in demo users.
- `page-id-resolver.ts`: pathname to dynamic page id resolution.
- `route-access.ts`: role-based frontend route access checks.

This directory should stay small. Page state belongs in `page/**/hooks/`; API calls belong in `api/` or `system/api/`; domain algorithms belong in directories such as `level/function/`, `player/function/`, or `game/engine/`.
