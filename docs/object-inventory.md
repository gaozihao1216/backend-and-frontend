# Object Inventory

后端对象按 `backend/microservice/src/<module>/objects/<Object>.scala` 存放；前端对象按 `frontend/src/objects/<module>/<object>.ts` 存放。前端文件使用 kebab-case，类型名与 Scala 对象名保持一致。

## System

| Object | Frontend file | Scala file |
| --- | --- | --- |
| UserRole | `frontend/src/objects/system/user-role.ts` | `backend/microservice/src/system/objects/UserRole.scala` |
| LevelStatus | `frontend/src/objects/system/level-status.ts` | `backend/microservice/src/system/objects/LevelStatus.scala` |
| SubmissionStatus | `frontend/src/objects/system/submission-status.ts` | `backend/microservice/src/system/objects/SubmissionStatus.scala` |
| LevelTag | `frontend/src/objects/system/level-tag.ts` | `backend/microservice/src/system/objects/LevelTag.scala` |
| ErrorBody | `frontend/src/objects/system/error-body.ts` | `backend/microservice/src/system/objects/ErrorBody.scala` |
| ApiFailure | `frontend/src/objects/system/api-failure.ts` | `backend/microservice/src/system/objects/ApiFailure.scala` |
| ApiSuccess | `frontend/src/objects/system/api-success.ts` | `backend/microservice/src/system/objects/ApiSuccess.scala` |

## Auth

| Object | Frontend file | Scala file |
| --- | --- | --- |
| BackendUser | `frontend/src/objects/auth/backend-user.ts` | `backend/microservice/src/auth/objects/BackendUser.scala` |

## User

| Object | Frontend file | Scala file |
| --- | --- | --- |
| UserProfile | `frontend/src/objects/user/user-profile.ts` | `backend/microservice/src/user/objects/UserProfile.scala` |
| UserProfileStats | `frontend/src/objects/user/user-profile-stats.ts` | `backend/microservice/src/user/objects/UserProfileStats.scala` |

## Level

| Object | Frontend file | Scala file |
| --- | --- | --- |
| Position | `frontend/src/objects/level/position.ts` | `backend/microservice/src/level/objects/Position.scala` |
| Size | `frontend/src/objects/level/size.ts` | `backend/microservice/src/level/objects/Size.scala` |
| GameWorld | `frontend/src/objects/level/game-world.ts` | `backend/microservice/src/level/objects/GameWorld.scala` |
| BirdInventory | `frontend/src/objects/level/bird-inventory.ts` | `backend/microservice/src/level/objects/BirdInventory.scala` |
| GroundLine | `frontend/src/objects/level/ground-line.ts` | `backend/microservice/src/level/objects/GroundLine.scala` |
| GroundBezier | `frontend/src/objects/level/ground-bezier.ts` | `backend/microservice/src/level/objects/GroundBezier.scala` |
| LevelGround | `frontend/src/objects/level/level-ground.ts` | `backend/microservice/src/level/objects/LevelGround.scala` |
| TerrainVoidSpan | `frontend/src/objects/level/terrain-void-span.ts` | `backend/microservice/src/level/objects/TerrainVoidSpan.scala` |
| LevelTerrain | `frontend/src/objects/level/level-terrain.ts` | `backend/microservice/src/level/objects/LevelTerrain.scala` |
| LevelObstacle | `frontend/src/objects/level/level-obstacle.ts` | `backend/microservice/src/level/objects/LevelObstacle.scala` |
| LevelEnemy | `frontend/src/objects/level/level-enemy.ts` | `backend/microservice/src/level/objects/LevelEnemy.scala` |
| LevelData | `frontend/src/objects/level/level-data.ts` | `backend/microservice/src/level/objects/LevelData.scala` |
| Level | `frontend/src/objects/level/level.ts` | `backend/microservice/src/level/objects/Level.scala` |
| LevelComment | `frontend/src/objects/level/level-comment.ts` | `backend/microservice/src/level/objects/LevelComment.scala` |
| Rating | `frontend/src/objects/level/rating.ts` | `backend/microservice/src/level/objects/Rating.scala` |
| Favorite | `frontend/src/objects/level/favorite.ts` | `backend/microservice/src/level/objects/Favorite.scala` |
| FavoriteWithLevel | `frontend/src/objects/level/favorite-with-level.ts` | `backend/microservice/src/level/objects/FavoriteWithLevel.scala` |
| Submission | `frontend/src/objects/level/submission.ts` | `backend/microservice/src/level/objects/Submission.scala` |
| SubmissionWithLevel | `frontend/src/objects/level/submission-with-level.ts` | `backend/microservice/src/level/objects/SubmissionWithLevel.scala` |

## Admin

| Object | Frontend file | Scala file |
| --- | --- | --- |
| ReviewedSubmission | `frontend/src/objects/admin/reviewed-submission.ts` | `backend/microservice/src/admin/objects/ReviewedSubmission.scala` |

## Compatibility Files

- `frontend/src/objects/system/system-objects.ts` keeps compatibility re-exports.
- `frontend/src/objects/designer-page/designer-page-types.ts` is page-local UI state, not a backend API object.
