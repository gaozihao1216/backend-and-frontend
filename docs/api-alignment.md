# API Alignment

## 1. 当前项目与老师模板的结构差异

### 当前项目原始状态

- 后端同时存在两套实现：
  - `src/backend` 下的 TypeScript + Express 运行时
  - `src/main/scala/microservice` 下的旧 Scala API 契约草稿
- 前端目录主要是：
  - `src/frontend/lib/api`
  - `src/frontend/components`
  - `src/frontend/pages`
- 共享类型主要在：
  - `src/shared/api`
  - `src/shared/schemas`
  - `src/shared/types.ts`

### 与老师 `backend-sample` 的主要差异

- 旧 Scala 代码使用了 `microservice` 目录，不符合老师样例的 `src/main/scala/routes + services/...` 布局。
- 旧 Scala 代码只有 API 契约摘要，没有真正的 `ApiRouter / HealthRouter / Main.scala` 挂载结构。
- 旧 Scala 代码没有把 `objects / api / routes / tables` 按模块拆开。
- 现有可运行后端其实仍是 `src/backend` 的 TypeScript 服务，不是 Scala 服务入口。

### 与老师 `frontend-sample` 的主要差异

- 当前前端 API 调用在 `src/frontend/lib/api`，老师样例是 `src/apis`。
- 当前路由入口仍主要由 `src/frontend/App.tsx` 组织，尚未抽成老师样例风格的 `router.tsx`。
- 当前共享对象更多放在 `src/shared/api` 和 `src/shared/schemas`，而不是单独的 `src/frontend/objects`。

### 本次调整后的对齐方式

- Scala 后端目录已调整为老师样例风格：
  - `src/main/scala/Main.scala`
  - `src/main/scala/DatabaseConfig.scala`
  - `src/main/scala/DatabaseSession.scala`
  - `src/main/scala/HttpError.scala`
  - `src/main/scala/SystemDefaults.scala`
  - `src/main/scala/routes/ApiRouter.scala`
  - `src/main/scala/routes/HealthRouter.scala`
  - `src/main/scala/services/<module>/{api,objects,routes,tables}`
- 旧 `src/main/scala/microservice` 和 `src/main/scala/com/example/microservice` 已删除，避免继续偏离老师模板。
- TypeScript 后端 `src/backend` 保留，用作现有业务逻辑对照，不在本次强制删除。

## 2. Scala 后端目录对齐结果

### 根目录文件

- `src/main/scala/Main.scala`
  - http4s + Ember 启动入口
- `src/main/scala/DatabaseConfig.scala`
  - 数据库配置对象
- `src/main/scala/DatabaseSession.scala`
  - 数据库 session 抽象
- `src/main/scala/HttpError.scala`
  - 统一 HTTP 错误对象与 `Either[HttpError, A]` 响应转换
- `src/main/scala/SystemDefaults.scala`
  - in-memory 默认数据和 service 实现

### 路由目录

- `src/main/scala/routes/ApiRouter.scala`
  - 统一挂载 `/auth`、`/users`、`/designer`、`/player`、`/admin`、`/health`
- `src/main/scala/routes/HealthRouter.scala`
  - 健康检查

### 模块目录

- `services/auth`
- `services/user`
- `services/level`
- `services/admin`
- `services/system`

这里把老师样例中的 `<module>` 映射成当前项目真实业务：

- `auth`: 本地身份绑定后端用户
- `user`: 用户资料页
- `level`: 设计师建关卡、玩家评分
- `admin`: 管理员审核 submission
- `system`: 健康检查与通用 API 响应对象

## 3. 前端 API 与 Scala API 的对应关系

### 认证

- 前端调用：
  - `src/frontend/lib/api/auth-api.ts`
- Scala 契约：
  - `src/main/scala/services/auth/api/AuthApi.scala`
- Scala objects：
  - `src/main/scala/services/auth/objects/AuthObjects.scala`
- Scala route：
  - `src/main/scala/services/auth/routes/AuthRouter.scala`
- Scala table：
  - `src/main/scala/services/auth/tables/UserTable.scala`

### 用户资料

- 前端调用：
  - `src/frontend/lib/api/user-api.ts`
- Scala 契约：
  - `src/main/scala/services/user/api/GetUserProfileApi.scala`
- Scala objects：
  - `src/main/scala/services/user/objects/UserObjects.scala`
- Scala route：
  - `src/main/scala/services/user/routes/UserRouter.scala`
- Scala table：
  - `src/main/scala/services/user/tables/UserProfileTable.scala`

### 关卡相关

- 前端调用：
  - `src/frontend/lib/api/designer-api.ts`
  - `src/frontend/lib/api/player-api.ts`
- Scala 契约：
  - `src/main/scala/services/level/api/CreateLevelApi.scala`
  - `src/main/scala/services/level/api/RateLevelApi.scala`
- Scala objects：
  - `src/main/scala/services/level/objects/LevelObjects.scala`
- Scala routes：
  - `src/main/scala/services/level/routes/DesignerLevelRouter.scala`
  - `src/main/scala/services/level/routes/PlayerLevelRouter.scala`
- Scala tables：
  - `src/main/scala/services/level/tables/LevelTables.scala`

### 管理审核

- 前端调用：
  - `src/frontend/lib/api/admin-api.ts`
- Scala 契约：
  - `src/main/scala/services/admin/api/ReviewSubmissionApi.scala`
- Scala objects：
  - `src/main/scala/services/admin/objects/AdminObjects.scala`
- Scala route：
  - `src/main/scala/services/admin/routes/AdminRouter.scala`
- Scala table：
  - `src/main/scala/services/admin/tables/AdminAuditTable.scala`

## 4. 前端 objects / shared schemas 与 Scala objects 的对应关系

### 用户对象

- TypeScript:
  - `src/shared/schemas/user.ts`
  - `src/shared/api/auth/objects.ts`
  - `src/shared/api/user/objects.ts`
- Scala:
  - `services/auth/objects/AuthObjects.scala`
  - `services/user/objects/UserObjects.scala`

### 关卡对象

- TypeScript:
  - `src/shared/schemas/level.ts`
  - `src/shared/api/designer/objects.ts`
  - `src/shared/api/player/objects.ts`
- Scala:
  - `services/level/objects/LevelObjects.scala`

### Submission / 审核对象

- TypeScript:
  - `src/shared/schemas/submission.ts`
  - `src/shared/api/admin/objects.ts`
- Scala:
  - `services/level/objects/LevelObjects.scala`
  - `services/admin/objects/AdminObjects.scala`

### 通用 API 响应对象

- TypeScript:
  - `src/shared/schemas/api.ts`
- Scala:
  - `services/system/objects/SystemObjects.scala`

Scala 侧对应的类型安全点：

- 请求和响应都用 `case class`
- 枚举和错误都用 `sealed trait`
- 路由只接受显式 request 类型
- 不使用 `Map[String, Any]`

## 5. 前端页面如何调用 API

- `src/frontend/pages/UserProfilePage.tsx`
  - 调用 `src/frontend/lib/api/user-api.ts`
- `src/frontend/pages/DesignerPage.tsx`
  - 调用 `src/frontend/lib/api/designer-api.ts`
- `src/frontend/pages/PlayerPage.tsx`
  - 调用 `src/frontend/lib/api/player-api.ts`
- `src/frontend/pages/AdminPage.tsx`
  - 调用 `src/frontend/lib/api/admin-api.ts`
- `src/frontend/components/auth/AuthLandingPage.tsx`
  - 调用 `src/frontend/lib/api/auth-api.ts`

## 6. ApiRouter 挂载关系

- `Main.scala`
  - 启动 http4s server
- `SystemDefaults.apiRoutes`
  - 组装默认 service
- `routes/ApiRouter.scala`
  - 挂载以下路由：
  - `/health` -> `HealthRouter`
  - `/auth` -> `AuthRouter`
  - `/users` -> `UserRouter`
  - `/designer` -> `DesignerLevelRouter`
  - `/player` -> `PlayerLevelRouter`
  - `/admin` -> `AdminRouter`

## 7. 已迁移的 5 个核心 API

### 1. `POST /auth/bind`

- 前端文件：
  - `src/frontend/lib/api/auth-api.ts`
- Scala API：
  - `services/auth/api/AuthApi.scala`
- Request：
  - `BindBackendUserRequest(localUserId, nickname, role)`
- Response：
  - `BindBackendUserResponse(user)`
- Error：
  - `AuthError`
  - 当前实现包含 `BindBackendUserValidation`
- 业务逻辑：
  - 用 `localUserId + role` 生成稳定绑定，如果旧用户已存在则复用，否则创建新用户。

### 2. `GET /users/:userId/profile`

- 前端文件：
  - `src/frontend/lib/api/user-api.ts`
- Scala API：
  - `services/user/api/GetUserProfileApi.scala`
- Request：
  - `GetUserProfileRequest(viewerUserId, userId)`
- Response：
  - `GetUserProfileResponse(profile)`
- Error：
  - `UserApiError`
  - 当前实现包含 `UserMissing`
- 业务逻辑：
  - 返回资料页真正需要的公开用户、已发布关卡、最近评论和统计信息。

### 3. `POST /designer/levels`

- 前端文件：
  - `src/frontend/lib/api/designer-api.ts`
- Scala API：
  - `services/level/api/CreateLevelApi.scala`
- Scala route：
  - `services/level/routes/DesignerLevelRouter.scala`
- Request：
  - `CreateLevelRequest(designerId, title, description, tags, data)`
- Response：
  - `CreateLevelResponse(level)`
- Error：
  - `DesignerLevelApiError`
  - 当前实现包含 `CreateLevelValidation`
- 业务逻辑：
  - 新建关卡时后端从 header 读取设计师身份，并把关卡初始化成 `draft`。

### 4. `POST /player/levels/:levelId/ratings`

- 前端文件：
  - `src/frontend/lib/api/player-api.ts`
- Scala API：
  - `services/level/api/RateLevelApi.scala`
- Scala route：
  - `services/level/routes/PlayerLevelRouter.scala`
- Request：
  - `RateLevelRequest(playerId, levelId, score)`
- Response：
  - `RateLevelResponse(rating)`
- Error：
  - `PlayerRatingApiError`
  - 当前实现包含 `LevelMissing`
  - 当前实现包含 `LevelNotPublished`
  - 当前实现包含 `InvalidScore`
- 业务逻辑：
  - 只允许玩家给已发布关卡评分，重复评分会更新旧记录并重算评分汇总。

### 5. `POST /admin/submissions/:submissionId/review`

- 前端文件：
  - `src/frontend/lib/api/admin-api.ts`
- Scala API：
  - `services/admin/api/ReviewSubmissionApi.scala`
- Scala route：
  - `services/admin/routes/AdminRouter.scala`
- Request：
  - `ReviewSubmissionRequest(reviewerId, submissionId, status, reviewNote)`
- Response：
  - `ReviewSubmissionResponse(submission)`
- Error：
  - `AdminReviewApiError`
  - 当前实现包含 `SubmissionMissing`
  - 当前实现包含 `SubmissionAlreadyReviewed`
  - 当前实现包含 `LinkedLevelMissing`
- 业务逻辑：
  - 只有待审核 submission 能审核，审核结果会同步更新 submission 和 level 状态。

## 8. 哪些 API 已完成 Scala 类型安全定义

已完成：

- `POST /auth/bind`
- `GET /users/:userId/profile`
- `POST /designer/levels`
- `POST /player/levels/:levelId/ratings`
- `POST /admin/submissions/:submissionId/review`
- `GET /health`

## 9. 哪些 API 仍需后续迁移

尚未迁到 Scala 的真实 API：

- `GET /auth/backend-users`
- `POST /designer/submissions`
- `GET /player/levels`
- `GET /player/levels/:levelId`
- `GET /player/levels/:levelId/comments`
- `POST /player/levels/:levelId/comments`
- `GET /player/favorites`
- `POST /player/levels/:levelId/favorite`
- `DELETE /player/levels/:levelId/favorite`
- `GET /admin/comments`
- `DELETE /admin/comments/:commentId`

这些 API 仍保留在 TypeScript 后端中，便于后续按相同模式继续迁移。

## 10. 函数式 / 类型安全体现点

- 每个 endpoint 都先定义显式 request / response `case class`
- 错误建模使用 `sealed trait`，不是裸字符串分支
- service trait 返回 `Either[HttpError, Response]`
- route 只负责：
  - 解析 header / path / body
  - 调用 service
  - 把 `Either` 转成 HTTP 响应
- 业务对象、API 契约、路由、table 结构是分离的
- `ApiSuccess[T]` / `ApiFailure` 与前端 `success/data`、`success/error` 结构对齐

## 11. 验证情况

已执行：

- `sbt compile`
- `npm run build`

当前环境阻塞：

- `sbt compile` 失败于 `java: command not found`
- `npm run build` 失败于 `tsc: not found`
- 仓库中当前不存在 `node_modules/.bin/tsc`

因此本轮已经完成代码结构调整和文档对齐，但无法在当前终端环境实际完成 Scala / TypeScript 编译验证。
