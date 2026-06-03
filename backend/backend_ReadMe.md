# Backend ReadMe

本文档说明当前 `backend/microservice/src` 下 Scala 后端的总体结构、分层职责、API 列表以及 APIMessage 的实现方式。

## 总体结构

Scala 后端采用按业务模块拆分的结构：

```text
backend/microservice/src
├── Main.scala
├── core
├── routes
├── system
├── auth
├── user
├── level
└── admin
```

核心约定：

- `api`：定义 `XxxAPIMessage`，负责权限校验、参数校验、业务流程、调用 table 层、返回结果。
- `objects`：定义对外返回或业务使用的数据对象。
- `routes`：只负责解析 HTTP 请求，包括 path、query、header、body，然后构造 APIMessage 并调用 `run(databaseSession)`。
- `tables`：封装数据访问。当前底层仍是 `InMemoryStore`，但对外接口已经逐步统一为 `XxxTable.method(connection, ...)`。
- `utils`：放模块内复用的小型辅助逻辑，不承载核心 API 业务流程。
- `core`：放通用能力，例如 APIMessage、DatabaseSession、HttpError、AccessControl、RowMappers、InMemoryStore。

## APIMessage 模式

当前后端 API 统一向 sample 的 APIMessage 模式靠齐：

```scala
final case class XxxAPIMessage(
  userId: String,
  body: XxxBody
) extends APIWithTokenMessage[ReturnType] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, ReturnType]] =
    ...
}
```

实现原则：

- APIMessage 的 case class 参数只包含请求参数，例如 `userId`、`playerId`、`designerId`、`levelId`、`body`。
- 不再向 APIMessage 注入业务函数，例如 `createLevel`、`rateLevel`、`deleteComment`。
- `plan(connection)` 内部完成权限校验、参数校验、table 调用和错误处理。
- routes 不承载核心业务逻辑。
- 当前仍保留 `IO[Either[HttpError, A]]` 返回模型，因为 routes 仍通过 `HttpError.fromEither` 统一包装响应。
- `APIWithTokenMessage` 仍要求 `token`，但实际字段已经改为具体 ID 语义，并通过 `override def token = userId/playerId/designerId` 兼容。

## Connection 当前阶段说明

当前阶段没有实现真实 PostgreSQL/JDBC 查询，也没有改造复杂事务系统。

- `DatabaseSession.inMemory` 仍使用 in-memory 模式。
- `connection` 参数用于对齐 APIMessage 和 table 层接口形态。
- `APIMessage.run` 通过 `DatabaseSession.withTransaction(plan)` 执行，事务边界已经集中在 session 层。
- table 方法内部仍访问 `InMemoryStore`，不会 dereference 当前 connection。
- table 对外数据访问方法已经统一为 connection-based 形态。
- 当前 in-memory `withTransaction` 是 no-op，内部委托给 `withConnection`。
- `DatabaseSession.jdbc(config)` 已提供真实 JDBC session，支持打开连接、关闭连接、事务 commit/rollback 和恢复 auto-commit。
- 默认启动仍使用 `DatabaseSession.inMemory(databaseConfig)`，后续切换真实数据库时还需要把 table 层替换为 SQL 实现。

## Core 层

### `APIMessage.scala`

定义 API 执行协议：

- `APIMessage[A]`：要求实现 `plan(connection: Connection)`。
- `run(databaseSession)`：通过 `databaseSession.withTransaction(plan)` 执行 API。
- `APIWithTokenMessage[A]`：兼容需要用户身份的 API。

### `DatabaseSession.scala`

当前提供 in-memory session。它负责给 APIMessage 提供一个 `Connection` 形态的参数，并提供统一的 `withTransaction` 事务边界。

当前提供两个 session 工厂：

- `DatabaseSession.inMemory(config)`：用于当前默认运行模式，`withTransaction` 是 no-op，内部委托给 `withConnection`。
- `DatabaseSession.jdbc(config)`：用于真实 JDBC 连接，`withTransaction` 会关闭 auto-commit，业务成功时 commit，业务失败或 API 返回 `Left(HttpError)` 时 rollback，最后恢复原 auto-commit 并关闭连接。

注意：真实 JDBC session 已具备事务边界，但 table 层当前仍是 `InMemoryStore` 实现；要真正持久化到 PostgreSQL，还需要继续替换 table 层 SQL。

### `AccessControl.scala`

封装角色校验：

- `requireRole(connection, userId, role)`：通过 `UserTable.findById(connection, userId)` 查用户并校验角色。

### `HttpError.scala`

统一错误对象和 HTTP response 转换：

- `badRequest`
- `unauthorized`
- `forbidden`
- `notFound`
- `conflict`
- `fromEither`

### `RowMappers.scala`

将 table row 转换为 API objects，例如 `LevelRow` 转 `Level`、`SubmissionRow` 转 `Submission`。

### `SystemDefaults.scala`

负责初始化 in-memory 默认数据和注册总路由，不承载 API 核心业务逻辑。

## Routes 层

### `routes/ApiRouter.scala`

总路由入口，将各模块路由挂载到统一路径：

- `/health`
- `/auth`
- `/users`
- `/designer`
- `/player`
- `/admin`

### `routes/HealthRouter.scala`

注册健康检查路由，构造 `HealthAPIMessage` 并执行。

### `auth/routes/AuthRouter.scala`

注册认证相关路由：

- `GET /auth/backend-users`
- `POST /auth/bind`

只解析 body 并调用 auth APIMessage。

### `user/routes/UserRouter.scala`

注册用户资料路由：

- `GET /users/:profileUserId/profile`

从 `x-user-id` 读取当前访问者 ID，构造 `GetUserProfileAPIMessage`。

### `level/routes/DesignerLevelRouter.scala`

注册设计师关卡路由：

- `POST /designer/levels`
- `POST /designer/submissions`

从 `x-user-id` 读取 `designerId`，解析请求 body 后构造对应 APIMessage。

### `level/routes/PlayerLevelRouter.scala`

注册玩家关卡路由：

- `GET /player/levels`
- `GET /player/levels/:levelId`
- `GET /player/levels/:levelId/comments`
- `POST /player/levels/:levelId/comments`
- `GET /player/favorites`
- `POST /player/levels/:levelId/favorite`
- `DELETE /player/levels/:levelId/favorite`
- `POST /player/levels/:levelId/ratings`

从 `x-user-id` 读取 `playerId`，解析 path、query、body 后构造对应 APIMessage。

### `admin/routes/AdminRouter.scala`

注册管理员路由：

- `GET /admin/comments`
- `DELETE /admin/comments/:commentId`
- `GET /admin/submissions/pending`
- `POST /admin/submissions/:submissionId/review`

从 `x-user-id` 读取 `userId/reviewerId`，构造 admin APIMessage。

## System API

### `HealthAPIMessage`

文件：`system/api/HealthApi.scala`

作用：返回服务健康状态。

实现方式：

- 不需要用户身份。
- 不访问 table。
- 返回 `HealthResponse(status = "ok")`。

## Auth API

### `GetBackendUsersAPIMessage`

文件：`auth/api/GetBackendUsersApi.scala`

作用：获取后端可绑定的演示用户列表。

实现方式：

- 不需要登录用户。
- 调用 `UserTable.listAll(connection)`。
- 通过 `RowMappers` 转成 `BackendUser` 列表。

### `BindBackendUserAPIMessage`

文件：`auth/api/BindBackendUserApi.scala`

作用：前端本地用户绑定到后端演示账号。

实现方式：

- 接收 `BindBackendUserRequest`。
- 先通过 `UserTable.findByUsername(connection, username)` 查已有用户。
- 如不存在，则根据 username 推断角色并创建新 `UserRow`。
- 新用户 ID 和时间戳在 plan 内生成。
- 调用 `UserTable.insert(connection, row)` 写入。
- 返回 `BackendUser`，不是 `{ user: BackendUser }` 包装对象。

## User API

### `GetUserProfileAPIMessage`

文件：`user/api/GetUserProfileApi.scala`

作用：获取用户公开资料、统计数据和近期评论。

实现方式：

- 使用 `viewerUserId` 兼容 APIWithTokenMessage。
- 调用 `UserTable.findById(connection, viewerUserId)` 确认访问者存在。
- 调用 `UserTable.findById(connection, profileUserId)` 获取资料用户。
- 调用 level、comment、favorite、rating 相关 table 方法统计数据。
- 返回 `UserProfile`。

## Level API

### `CreateLevelAPIMessage`

文件：`level/api/CreateLevelApi.scala`

作用：设计师创建草稿关卡。

实现方式：

- 从请求身份获取 `designerId`。
- `AccessControl.requireRole(connection, designerId, UserRole.Designer)` 校验设计师权限。
- 校验标题不能为空。
- 使用 `Instant.now().toString` 生成时间戳。
- 调用 `LevelTable.nextId(connection)` 和 `LevelTable.insert(connection, row)`。
- 新关卡状态为 `Draft`，评分统计初始化为 0。

### `SubmitLevelAPIMessage`

文件：`level/api/SubmitLevelApi.scala`

作用：设计师提交自己的草稿或被拒关卡进入审核。

实现方式：

- 校验 `designerId` 是设计师。
- `LevelTable.findById(connection, levelId)` 查关卡。
- 校验关卡属于当前设计师。
- `SubmissionTable.hasPendingForLevel(connection, levelId)` 防止重复待审提交。
- 只允许 `Draft` 或 `Rejected` 状态提交。
- 调用 `LevelTable.updateSubmissionStatus(connection, ...)` 更新关卡为 `PendingReview`。
- 调用 `SubmissionTable.nextId(connection)` 和 `SubmissionTable.insert(connection, row)` 创建 submission。

### `GetPublishedLevelsAPIMessage`

文件：`level/api/GetPublishedLevelsApi.scala`

作用：玩家获取已发布关卡列表。

实现方式：

- 校验 `playerId` 是玩家。
- 支持可选 `tag` 过滤和 `sort` 排序。
- 调用 `LevelTable.listPublished(connection, tag, sort)`。
- 返回 `List[Level]`。

### `GetPublishedLevelAPIMessage`

文件：`level/api/GetPublishedLevelApi.scala`

作用：玩家获取单个已发布关卡详情。

实现方式：

- 校验 `playerId` 是玩家。
- 调用 `LevelApiSupport.publishedLevel(connection, levelId)`。
- 未找到或非 published 状态时返回错误。

### `GetLevelCommentsAPIMessage`

文件：`level/api/GetLevelCommentsApi.scala`

作用：玩家获取某个已发布关卡的评论。

实现方式：

- 校验玩家身份。
- 先确认关卡已发布。
- 调用 `CommentTable.listByLevel(connection, levelId)`。

### `CreateCommentAPIMessage`

文件：`level/api/CreateCommentApi.scala`

作用：玩家给已发布关卡发表评论。

实现方式：

- 校验玩家身份。
- 确认关卡已发布。
- 校验评论内容不能为空。
- 使用 `Instant.now().toString` 生成时间戳。
- 调用 `CommentTable.nextId(connection)` 和 `CommentTable.insert(connection, row)`。

### `GetFavoriteLevelsAPIMessage`

文件：`level/api/GetFavoriteLevelsApi.scala`

作用：玩家获取收藏的已发布关卡列表。

实现方式：

- 校验玩家身份。
- 调用 `FavoriteTable.listPublishedByUser(connection, playerId)`。
- 返回 `FavoriteWithLevel` 列表。

### `FavoriteLevelAPIMessage`

文件：`level/api/FavoriteLevelApi.scala`

作用：玩家收藏已发布关卡。

实现方式：

- 校验玩家身份。
- 确认关卡已发布。
- 如果已收藏则返回冲突错误。
- 使用 `FavoriteTable.nextId(connection)` 和 `FavoriteTable.insert(connection, favorite)` 写入。

### `UnfavoriteLevelAPIMessage`

文件：`level/api/UnfavoriteLevelApi.scala`

作用：玩家取消收藏已发布关卡。

实现方式：

- 校验玩家身份。
- 确认关卡已发布。
- 调用 `FavoriteTable.delete(connection, playerId, levelId)`。
- 未收藏时返回 not found。

### `RateLevelAPIMessage`

文件：`level/api/RateLevelApi.scala`

作用：玩家给已发布关卡评分。

实现方式：

- 校验玩家身份。
- 查找关卡并确认状态为 `Published`。
- 校验评分范围为 1 到 5。
- 如果已有评分，调用 `RatingTable.updateScore(connection, ...)` 覆盖旧评分。
- 如果没有评分，调用 `RatingTable.nextId(connection)` 和 `RatingTable.insert(connection, row)` 新增评分。
- 调用 `RatingTable.listByLevel(connection, levelId)` 重新计算平均分。
- 调用 `LevelTable.updateRatingStats(connection, ...)` 回写关卡评分统计。

## Admin API

### `GetAdminCommentsAPIMessage`

文件：`admin/api/GetAdminCommentsApi.scala`

作用：管理员查看全部评论。

实现方式：

- 使用 `userId` 兼容 APIWithTokenMessage。
- `AccessControl.requireRole(connection, userId, UserRole.Admin)` 校验管理员权限。
- 调用 `CommentTable.listAllForAdmin(connection)`。
- 返回评论列表。

### `DeleteCommentAPIMessage`

文件：`admin/api/DeleteCommentApi.scala`

作用：管理员删除指定评论。

实现方式：

- 校验管理员权限。
- 调用 `CommentTable.deleteById(connection, commentId)`。
- 删除成功返回被删除评论。
- 评论不存在返回 not found。

### `GetPendingSubmissionsAPIMessage`

文件：`admin/api/GetPendingSubmissionsApi.scala`

作用：管理员获取待审核投稿列表。

实现方式：

- 校验管理员权限。
- 调用 `SubmissionTable.listPending(connection)`。
- 对每个 submission 调用 `LevelTable.findById(connection, levelId)` 组装 `SubmissionWithLevel`。

### `ReviewSubmissionAPIMessage`

文件：`admin/api/ReviewSubmissionApi.scala`

作用：管理员审核关卡投稿。

实现方式：

- 使用 `userId` 表示 reviewer。
- 校验管理员权限。
- 校验审核状态只允许 `Approved` 或 `Rejected`。
- `SubmissionTable.findById(connection, submissionId)` 查 submission。
- `LevelTable.findById(connection, levelId)` 查关卡。
- 使用 `Instant.now().toString` 生成审核时间。
- 调用 `SubmissionTable.updateReview(connection, ...)` 更新 submission。
- 调用 `LevelTable.updateReviewStatus(connection, ...)` 更新关卡状态、拒绝原因、发布时间。

## Tables 层

当前 table 层仍使用 `InMemoryStore`，但已提供 connection-based 外部接口。

主要 table：

- `UserTable`：用户查询、按 username 查询、按 role 计数、插入用户。
- `LevelTable`：关卡查询、发布列表、创建、提交状态更新、审核状态更新、评分统计更新。
- `SubmissionTable`：待审列表、按 ID 查询、待审重复检查、创建、审核更新。
- `CommentTable`：评论列表、近期评论、按关卡评论、创建、删除。
- `FavoriteTable`：收藏查询、收藏列表、创建、删除。
- `RatingTable`：评分查询、按关卡列表、创建、更新分数、按玩家计数。

注意：table 对外方法已经清理为 connection-based 入口；当前内部仍使用 `InMemoryStore`。

## Objects 层

objects 层只描述数据结构，不放业务流程。

主要对象：

- `auth/objects/BackendUser.scala`
- `user/objects/UserProfile.scala`
- `user/objects/UserProfileStats.scala`
- `level/objects/Level.scala`
- `level/objects/LevelData.scala`
- `level/objects/Submission.scala`
- `level/objects/SubmissionWithLevel.scala`
- `level/objects/Rating.scala`
- `level/objects/Favorite.scala`
- `level/objects/FavoriteWithLevel.scala`
- `level/objects/LevelComment.scala`
- `admin/objects/ReviewedSubmission.scala`
- `system/objects/ApiSuccess.scala`
- `system/objects/ApiFailure.scala`
- `system/objects/ErrorBody.scala`
- `system/objects/UserRole.scala`
- `system/objects/LevelStatus.scala`
- `system/objects/SubmissionStatus.scala`
- `system/objects/LevelTag.scala`

## 权限模型

当前角色定义在 `system/objects/UserRole.scala`：

- `Player`
- `Designer`
- `Admin`

权限校验统一通过 `AccessControl.requireRole(connection, userId, role)` 完成，不能只依赖前端隐藏按钮或 routes 判断。

## 手动验证建议

后端编译：

```bash
sbt compile
```

健康检查：

```bash
curl http://127.0.0.1:3000/health
```

获取玩家关卡列表：

```bash
curl http://127.0.0.1:3000/player/levels -H "x-user-id: player-1"
```

获取管理员待审投稿：

```bash
curl http://127.0.0.1:3000/admin/submissions/pending -H "x-user-id: admin-1"
```

创建关卡：

```bash
curl -X POST http://127.0.0.1:3000/designer/levels \
  -H "x-user-id: designer-1" \
  -H "content-type: application/json" \
  -d '{"title":"New Level","description":"demo","tags":["beginner"],"data":{"world":{"width":1600,"height":900,"gravity":1},"ground":null,"terrain":null,"birdInventory":{"basic":3},"obstacles":[],"enemies":[]}}'
```

## 后续改造建议

建议按以下顺序继续：

1. 将 table 层替换为真实 JDBC/PostgreSQL SQL 实现。
2. 增加数据库初始化和迁移逻辑。
3. 将默认 session 从 `inMemory` 切换为 `jdbc`。
