# API Inventory

当前后端是一个 Scala 大服务，按逻辑模块拆在 `backend/microservice/src/<module>` 下。每个模块都有 `api`、`objects`、`routes`、`tables`、`utils` 目录。前端按同样模块拆在 `frontend/src/api/<module>` 和 `frontend/src/objects/<module>`。

## API 对照表

| API | Method | Path | Frontend API file | Scala API file | Scala route file | Main objects |
| --- | --- | --- | --- | --- | --- | --- |
| Health | GET | `/health` | `frontend/src/api/system/HealthApi.ts` | `backend/microservice/src/system/api/HealthApi.scala` | `backend/microservice/src/routes/HealthRouter.scala` | `frontend/src/objects/system/system-objects.ts`, `backend/microservice/src/system/api/HealthApi.scala` |
| GetBackendUsers | GET | `/auth/backend-users` | `frontend/src/api/auth/GetBackendUsersApi.ts` | `backend/microservice/src/auth/api/GetBackendUsersApi.scala` | `backend/microservice/src/auth/routes/AuthRouter.scala` | `frontend/src/objects/auth/backend-user.ts`, `backend/microservice/src/auth/objects/BackendUser.scala` |
| BindBackendUser | POST | `/auth/bind` | `frontend/src/api/auth/BindBackendUserApi.ts` | `backend/microservice/src/auth/api/BindBackendUserApi.scala` | `backend/microservice/src/auth/routes/AuthRouter.scala` | `frontend/src/objects/auth/backend-user.ts`, `backend/microservice/src/auth/objects/BackendUser.scala` |
| GetUserProfile | GET | `/users/:userId/profile` | `frontend/src/api/user/GetUserProfileApi.ts` | `backend/microservice/src/user/api/GetUserProfileApi.scala` | `backend/microservice/src/user/routes/UserRouter.scala` | `frontend/src/objects/user/user-profile.ts`, `backend/microservice/src/user/objects/UserProfile.scala`, `backend/microservice/src/user/objects/UserProfileStats.scala` |
| CreateLevel | POST | `/designer/levels` | `frontend/src/api/level/CreateLevelApi.ts` | `backend/microservice/src/level/api/CreateLevelApi.scala` | `backend/microservice/src/level/routes/DesignerLevelRouter.scala` | `frontend/src/objects/level/level.ts`, `frontend/src/objects/level/level-data.ts`, `backend/microservice/src/level/objects/Level.scala`, `backend/microservice/src/level/objects/LevelData.scala` |
| SubmitLevel | POST | `/designer/submissions` | `frontend/src/api/level/SubmitLevelApi.ts` | `backend/microservice/src/level/api/SubmitLevelApi.scala` | `backend/microservice/src/level/routes/DesignerLevelRouter.scala` | `frontend/src/objects/level/submission.ts`, `backend/microservice/src/level/objects/Submission.scala` |
| GetPublishedLevels | GET | `/player/levels` | `frontend/src/api/level/GetPublishedLevelsApi.ts` | `backend/microservice/src/level/api/GetPublishedLevelsApi.scala` | `backend/microservice/src/level/routes/PlayerLevelRouter.scala` | `frontend/src/objects/level/level.ts`, `backend/microservice/src/level/objects/Level.scala` |
| GetPublishedLevel | GET | `/player/levels/:levelId` | `frontend/src/api/level/GetPublishedLevelApi.ts` | `backend/microservice/src/level/api/GetPublishedLevelApi.scala` | `backend/microservice/src/level/routes/PlayerLevelRouter.scala` | `frontend/src/objects/level/level.ts`, `backend/microservice/src/level/objects/Level.scala` |
| GetLevelComments | GET | `/player/levels/:levelId/comments` | `frontend/src/api/level/GetLevelCommentsApi.ts` | `backend/microservice/src/level/api/GetLevelCommentsApi.scala` | `backend/microservice/src/level/routes/PlayerLevelRouter.scala` | `frontend/src/objects/level/level-comment.ts`, `backend/microservice/src/level/objects/LevelComment.scala` |
| CreateComment | POST | `/player/levels/:levelId/comments` | `frontend/src/api/level/CreateCommentApi.ts` | `backend/microservice/src/level/api/CreateCommentApi.scala` | `backend/microservice/src/level/routes/PlayerLevelRouter.scala` | `frontend/src/objects/level/level-comment.ts`, `backend/microservice/src/level/objects/LevelComment.scala` |
| GetFavoriteLevels | GET | `/player/favorites` | `frontend/src/api/level/GetFavoriteLevelsApi.ts` | `backend/microservice/src/level/api/GetFavoriteLevelsApi.scala` | `backend/microservice/src/level/routes/PlayerLevelRouter.scala` | `frontend/src/objects/level/favorite.ts`, `backend/microservice/src/level/objects/Favorite.scala`, `backend/microservice/src/level/objects/FavoriteWithLevel.scala` |
| FavoriteLevel | POST | `/player/levels/:levelId/favorite` | `frontend/src/api/level/FavoriteLevelApi.ts` | `backend/microservice/src/level/api/FavoriteLevelApi.scala` | `backend/microservice/src/level/routes/PlayerLevelRouter.scala` | `frontend/src/objects/level/favorite.ts`, `backend/microservice/src/level/objects/Favorite.scala` |
| UnfavoriteLevel | DELETE | `/player/levels/:levelId/favorite` | `frontend/src/api/level/UnfavoriteLevelApi.ts` | `backend/microservice/src/level/api/UnfavoriteLevelApi.scala` | `backend/microservice/src/level/routes/PlayerLevelRouter.scala` | `frontend/src/objects/level/favorite.ts`, `backend/microservice/src/level/objects/Favorite.scala` |
| RateLevel | POST | `/player/levels/:levelId/ratings` | `frontend/src/api/level/RateLevelApi.ts` | `backend/microservice/src/level/api/RateLevelApi.scala` | `backend/microservice/src/level/routes/PlayerLevelRouter.scala` | `frontend/src/objects/level/rating.ts`, `backend/microservice/src/level/objects/Rating.scala` |
| GetAdminComments | GET | `/admin/comments` | `frontend/src/api/admin/GetAdminCommentsApi.ts` | `backend/microservice/src/admin/api/GetAdminCommentsApi.scala` | `backend/microservice/src/admin/routes/AdminRouter.scala` | `frontend/src/objects/level/level-comment.ts`, `backend/microservice/src/level/objects/LevelComment.scala` |
| DeleteComment | DELETE | `/admin/comments/:commentId` | `frontend/src/api/admin/DeleteCommentApi.ts` | `backend/microservice/src/admin/api/DeleteCommentApi.scala` | `backend/microservice/src/admin/routes/AdminRouter.scala` | `frontend/src/objects/level/level-comment.ts`, `backend/microservice/src/level/objects/LevelComment.scala` |
| GetPendingSubmissions | GET | `/admin/submissions/pending` | `frontend/src/api/admin/GetPendingSubmissionsApi.ts` | `backend/microservice/src/admin/api/GetPendingSubmissionsApi.scala` | `backend/microservice/src/admin/routes/AdminRouter.scala` | `frontend/src/objects/level/submission.ts`, `backend/microservice/src/level/objects/SubmissionWithLevel.scala` |
| ReviewSubmission | POST | `/admin/submissions/:submissionId/review` | `frontend/src/api/admin/ReviewSubmissionApi.ts` | `backend/microservice/src/admin/api/ReviewSubmissionApi.scala` | `backend/microservice/src/admin/routes/AdminRouter.scala` | `frontend/src/objects/level/submission.ts`, `frontend/src/objects/admin/reviewed-submission.ts`, `backend/microservice/src/admin/objects/ReviewedSubmission.scala` |

## 结构约定

- 后端 API 类型放在 `backend/microservice/src/<module>/api/*Api.scala`。
- 后端领域对象放在 `backend/microservice/src/<module>/objects/*.scala`。
- 后端路由只做 HTTP path/header/body 解析，放在 `backend/microservice/src/<module>/routes`。
- 后端表/持久化投影放在 `backend/microservice/src/<module>/tables`。
- 后端模块工具函数预留在 `backend/microservice/src/<module>/utils`。
- 前端 API 调用放在 `frontend/src/api/<module>/*Api.ts`。
- 前端对象和 Zod schema 放在 `frontend/src/objects/<module>/*.ts`。
- `frontend/src/api/*-api.ts` 和 `frontend/src/api/api-contracts.ts` 目前保留为兼容聚合入口。
