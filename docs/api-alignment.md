# API Alignment

## 目录约定

- 前端 API 调用在 `src/frontend/lib/api`
- TypeScript 共享契约在 `src/shared/api` 和 `src/shared/schemas`
- 现有 Node/Express 路由在 `src/backend/routes`
- 现有业务实现参考在 `src/backend/services`
- 新增 Scala microservice API 定义在 `src/main/scala/microservice`
- 额外建立了 `scala/microservice/README.md`，用于在 code review 时明确说明课程要求中的字面目录

`src/main/scala/microservice` 是 sbt 会实际编译的源码目录；`scala/microservice` 只是课程展示入口，不参与编译。

## 类型安全框架

Scala API 定义层采用以下最小抽象：

- `microservice.framework.HttpMethod`
  - 用 sealed trait 约束 HTTP method
- `microservice.framework.ApiEndpoint[Req, Res, Err]`
  - 显式描述 `method`、`path`、`description`、`businessRules`
- `microservice.framework.ApiError`
  - 用 sealed trait 约束错误模型
- 各领域 `trait XxxService[F[_]]`
  - 统一使用 `F[Either[Err, Res]]` 表达副作用与业务失败

这样做到：

- request / response 使用 case class
- error 使用 sealed trait
- service interface 使用 trait
- 业务失败使用 `Either`
- API 契约和业务实现分离

## 已完成 Scala 定义的核心 API

### 1. Auth: `POST /auth/bind`

- 前端调用：`src/frontend/lib/api/auth-api.ts`
- TS 契约：`src/shared/api/auth/*`
- Node 路由：`src/backend/routes/auth-routes.ts`
- Scala 定义：`microservice.contracts.AuthApi`

对应关系：

- TS request: `BindBackendUserRequestBodySchema`
- Scala request: `BindBackendUserRequest`
- TS response data: `BoundBackendUserSchema`
- Scala response: `BoundBackendUser`

业务逻辑：

- 根据 `localUserId + role` 生成确定性的后端用户名
- 如果该绑定已经存在，则复用旧用户
- 如果不存在，则创建新用户

### 2. User: `GET /users/:userId/profile`

- 前端调用：`src/frontend/lib/api/user-api.ts`
- TS 契约：`src/shared/api/user/*`
- Node 路由：`src/backend/routes/user-routes.ts`
- Scala 定义：`microservice.contracts.UserApi`

对应关系：

- TS params: `GetUserProfileRequestParamsSchema`
- Scala request: `GetUserProfileRequest`
- TS response data: `GetUserProfileResponseDataSchema`
- Scala response: `UserProfile`

业务逻辑：

- 根据 `userId` 查用户
- 只返回已发布关卡
- 只返回最近 5 条评论
- 统计收藏数和评分数

### 3. Designer: `POST /designer/levels`

- 前端调用：`src/frontend/lib/api/designer-api.ts`
- TS 契约：`src/shared/api/designer/*`
- Node 路由：`src/backend/routes/designer-routes.ts`
- Scala 定义：`microservice.contracts.DesignerApi`

对应关系：

- TS body: `CreateLevelRequestBodySchema`
- Scala request: `CreateLevelRequest`
- TS response data: `CreateLevelResponseDataSchema`
- Scala response: `Level`

业务逻辑：

- 从认证上下文拿 `designerId`
- 新建关卡时固定为 `draft`
- 初始化 `averageRating = 0`、`ratingCount = 0`

### 4. Player: `POST /player/levels/:levelId/ratings`

- 前端调用：`src/frontend/lib/api/player-api.ts`
- TS 契约：`src/shared/api/player/*`
- Node 路由：`src/backend/routes/player-routes.ts`
- Scala 定义：`microservice.contracts.PlayerApi`

对应关系：

- TS params/body: `RateLevelRequestParamsSchema` + `RateLevelRequestBodySchema`
- Scala request: `RateLevelRequest`
- TS response data: `RateLevelResponseDataSchema`
- Scala response: `Rating`

业务逻辑：

- 只能给 `published` 关卡评分
- 同一玩家对同一关卡只有一条评分记录
- 重复评分是更新，不是新增
- 每次评分后都刷新关卡平均分和评分数

### 5. Admin: `POST /admin/submissions/:submissionId/review`

- 前端调用：`src/frontend/lib/api/admin-api.ts`
- TS 契约：`src/shared/api/admin/*`
- Node 路由：`src/backend/routes/admin-routes.ts`
- Scala 定义：`microservice.contracts.AdminApi`

对应关系：

- TS params/body: `ReviewSubmissionRequestParamsSchema` + `ReviewSubmissionRequestBodySchema`
- Scala request: `ReviewSubmissionRequest`
- TS response data: `ReviewSubmissionResponseDataSchema`
- Scala response: `Submission`

业务逻辑：

- 只能审核 `pending_review` 的 submission
- 记录 `reviewerId`、`reviewNote`、`reviewedAt`
- 审核通过时发布关卡，拒绝时将关卡标记为 rejected

## 当前未完全迁移的部分

以下能力仍由 TypeScript/Node 实现，Scala 目前只补了 API 定义层，没有替换运行时逻辑：

- `GET /auth/backend-users`
- `POST /designer/submissions`
- `GET /player/levels`
- `GET /player/levels/:levelId`
- 评论、收藏、管理员评论管理等其余接口

原因：

- 课程当前硬性要求是 Scala API 定义、类型安全表达、可讲清业务逻辑，并不要求一次性重写全部后端
- 为了最小改造，先保留现有 TS service 作为真实参考实现

## Code Review 讲法

建议按固定顺序讲：

1. 前端从 `src/frontend/lib/api` 发请求
2. TS 契约在 `src/shared/api` / `src/shared/schemas`
3. Scala 在 `src/main/scala/microservice/contracts` 重新声明同一组 request / response / error
4. `ApiEndpoint` 负责定义 method/path/契约/业务规则
5. `trait XxxService[F[_]]` 负责定义可替换的业务接口签名
6. 现阶段真实业务逻辑仍参考 `src/backend/services`

这样可以明确说明：前后端契约对齐了，Scala 层负责课程要求的函数式 / 类型安全 API 定义，Node 层暂时保留作为现有实现。
