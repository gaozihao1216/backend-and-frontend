# Objects layer

Zod schemas and TypeScript types aligned with the Scala backend `backend/microservice/src/*/objects/` layout. HTTP request schemas for frontend API calls still live next to each API in `frontend/src/api/*/body/`; backend request objects now live under `<module>/objects/<子域>/`.

## Layout

```text
objects/
├── system/          # ApiSuccess, ErrorBody, enums (UserRole, LevelStatus, …)
├── auth/            # BackendUser
├── user/            # UserProfile, UserProfileStats
├── level/
│   ├── level/       # Level, LevelData, GameWorld, create-level-input
│   ├── social/      # Favorite, Rating, LevelComment, …
│   ├── submission/  # Submission, SubmissionWithLevel
│   ├── inventory/   # BirdPool, BirdInventory
│   ├── terrain/     # Position, Size, LevelGround, LevelTerrain, obstacles, enemies
│   └── level-background-template.ts   # frontend-only extension
├── admin/
│   ├── submission/  # ReviewAudit, ReviewedSubmission
│   └── director/
│       ├── permissions/       # DirectorPermissionSummary, DirectorTransferResult
│       └── level_assignment/
│           ├── assignment/    # LevelSlotAssignment, LevelSlotAssignmentDetail
│           └── board/         # DirectorLevelAssignmentBoard, BirdPoolOption
├── bird/
│   ├── design/      # BirdDesign
│   ├── submission/  # BirdSubmission, BirdSubmissionWithDesign
│   └── skill/director/   # DirectorBirdSkillEntry/Board + bird-skill-helpers (frontend)
├── player/shop/     # ShopItem
├── ui/              # mirrors backend ui/objects/
│   ├── component/   # PageComponent variants, ComponentPosition, ComponentAction, …
│   ├── page/        # PageConfig, PageLayout, UiEndpoint
│   ├── button_template/
│   ├── category/
│   ├── stretch_template/
│   └── page-config.ts   # barrel re-export of ui/component + ui/page
├── ui-customization/    # frontend-only: defaults, normalizers, route tree, level-map structure
├── director-page/       # director editor page types (frontend-only)
└── designer-page/       # designer editor page types (frontend-only)

## Shared seed data

关卡种子与内置示例不在 `objects/`，而在 `frontend/src/shared/levels/`（如 `starter-level.ts`）。
```

## Backend mapping

| Frontend path | Backend path |
| --- | --- |
| `objects/level/level/level.ts` | `level/objects/level/Level.scala` |
| `objects/level/terrain/position.ts` | `level/objects/terrain/Position.scala` |
| `objects/admin/submission/review-audit.ts` | `admin/objects/submission/ReviewAudit.scala` |
| `objects/admin/director/level_assignment/assignment/` | `admin/objects/director/level_assignment/assignment/` |
| `objects/admin/director/level_assignment/board/` | `admin/objects/director/level_assignment/board/` |
| `objects/bird/skill/director/director-bird-skill-entry.ts` | `bird/objects/skill/director/DirectorBirdSkillEntry.scala` |
| `objects/ui/page/page-config.ts` | `ui/objects/page/PageConfig.scala` |
| `objects/ui/component/page-component.ts` | `ui/objects/component/PageComponent.scala` |
| `objects/player/shop/shop-item.ts` | `player/objects/shop/ShopItem.scala` |

## Import conventions

- Prefer **direct imports** from the mirrored subpath, e.g. `objects/level/inventory/bird-pool.js`.
- `objects/ui/page-config.ts` re-exports all UI domain schemas for convenience.
- `objects/ui-customization/ui-customization-objects.ts` re-exports UI domain types **plus** frontend-only helpers (`default-page-configs`, `preview-user`, level-map structures) for backward compatibility.
- Frontend-only config stays under `ui-customization/` and is **not** moved into `ui/`.

## Naming

- Filenames: kebab-case (`level-slot-assignment.ts`).
- Exported schema/type names match Scala case classes (`LevelSlotAssignmentSchema`, `LevelSlotAssignment`).
