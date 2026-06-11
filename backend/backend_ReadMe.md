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

当前阶段已经提供真实 PostgreSQL/JDBC session，并为主要业务表补齐 SQL table 实现；默认启动仍保持 in-memory，避免本地没有 PostgreSQL 时无法运行。

- `DatabaseSession.inMemory` 仍使用 in-memory 模式。
- `DatabaseSession.jdbc(config)` 使用真实 JDBC connection 和事务。
- `connection` 参数用于 table 层在 in-memory/JDBC 实现之间分流。
- `APIMessage.run` 通过 `DatabaseSession.withTransactionEither(plan)` 执行：`Right` commit，`Left` rollback（无异常驱动回滚）。
- table 对外数据访问方法已经统一为 connection-based 形态。
- 当前 in-memory `withTransaction` / `withTransactionEither` 等价于 `withConnection`。
- `DatabaseSession.jdbc(config)` 已提供真实 JDBC session，支持打开连接、关闭连接、事务 commit/rollback 和恢复 auto-commit。
- 默认启动使用 `DatabaseSession.inMemory(databaseConfig)`；设置 `UGC_DATABASE_MODE=jdbc` 后切换到 PostgreSQL。
- 可通过 `UGC_DATABASE_URL`、`UGC_DATABASE_USERNAME`、`UGC_DATABASE_PASSWORD`、`UGC_DATABASE_DRIVER`、`UGC_DATABASE_SCHEMA` 覆盖数据库配置。

## Core 层

### `APIMessage.scala`

定义 API 执行协议：

- `APIMessage[A]`：要求实现 `plan(connection: Connection)`。
- `run(databaseSession)`：通过 `databaseSession.withTransactionEither(plan)` 执行 API。
- `APIWithTokenMessage[A]`：兼容需要用户身份的 API。

### `DatabaseSession.scala`

当前提供 in-memory 和 JDBC 两种 session。它负责给 APIMessage 提供一个 `Connection` 形态的参数，并提供 `withTransaction` / `withTransactionEither` 事务边界。

当前提供两个 session 工厂：

- `DatabaseSession.inMemory(config)`：默认运行模式，`withTransactionEither` 等价于 `withConnection`。
- `DatabaseSession.jdbc(config)`：真实 JDBC 连接；`withTransactionEither` 在 `Right` 时 commit、`Left` 时 rollback，IO 异常时 rollback 并向上抛出。

注意：默认仍是 in-memory 模式。真实持久化需要设置 `UGC_DATABASE_MODE=jdbc`，并确保 PostgreSQL 已按 `backend/docker/init-store.sql` 初始化。

### PostgreSQL/JDBC 本地启动

仓库根目录提供了 `docker-compose.yml`，用于启动本地 PostgreSQL 并在首次创建数据卷时执行 `backend/docker/init-store.sql`。

```bash
npm run postgres:up
# 或 docker compose up -d postgres
```

使用 JDBC 模式运行 Scala 服务：

```bash
npm run dev:backend:postgres
# 或
UGC_DATABASE_MODE=jdbc \
UGC_DATABASE_URL=jdbc:postgresql://localhost:5432/ugc_level_platform \
UGC_DATABASE_USERNAME=postgres \
UGC_DATABASE_PASSWORD=postgres \
sbt run
```

如果修改了 `backend/docker/init-store.sql` 并需要重新执行初始化脚本，需要删除旧数据卷后重启数据库：

```bash
docker compose down -v
docker compose up -d postgres
```

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

负责读取数据库配置、初始化默认数据/数据库表、注册总路由，并提供 `initializeDatabase` 启动初始化入口，不承载 API 核心业务逻辑。

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

### `user/routes/AuthRouter.scala`

注册认证相关路由：

- `GET /auth/backend-users`
- `POST /auth/bind`

只解析 body 并调用 user 模块 APIMessage。

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

该模块已拆分为：

- `PlayerLevelRouter.scala`：对外入口，组合 read/action 路由。
- `PlayerLevelReadRouter.scala`：玩家读取类路由。
- `PlayerLevelActionRouter.scala`：评论、收藏、评分等动作路由。
- `PlayerLevelRouteSupport.scala`：共享 header/query 解析。

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

文件：`user/api/GetBackendUsersApi.scala`

作用：获取后端可绑定的演示用户列表。

实现方式：

- 不需要登录用户。
- 调用 `UserTable.listAll(connection)`。
- 通过 `RowMappers` 转成 `BackendUser` 列表。

### `BindBackendUserAPIMessage`

文件：`user/api/BindBackendUserApi.scala`

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

当前 table 层已提供 connection-based 外部接口。

主要 table：

- `UserTable`：用户查询、按 username 查询、按 role 计数、插入用户；当前已支持真实 JDBC SQL 路径，并提供 `initialize(connection)` 创建 `users` 表。
- `LevelTable`：关卡查询、发布列表、创建、提交状态更新、审核状态更新、评分统计更新；当前公开方法已支持真实 JDBC SQL 路径。
- `SubmissionTable`：待审列表、按 ID 查询、待审重复检查、创建、审核更新；当前公开方法已支持真实 JDBC SQL 路径。
- `CommentTable`：评论列表、近期评论、按关卡评论、创建、删除；当前公开方法已支持真实 JDBC SQL 路径。
- `FavoriteTable`：收藏查询、收藏列表、创建、删除。
- `RatingTable`：评分查询、按关卡列表、创建、更新分数、按玩家计数；当前公开方法已支持真实 JDBC SQL 路径。

注意：table 对外方法已经清理为 connection-based 入口；`UserTable`、`LevelTable`、`SubmissionTable`、`RatingTable`、`CommentTable` 已有 JDBC SQL 路径，其他 table 当前内部仍使用 `InMemoryStore`。

### `UserTable` JDBC 实现

`user/tables` 已按职责拆分：

- `UserRow.scala`：保存 `UserRow`。
- `UserTable.scala`：对外 facade，根据 connection 分发到 in-memory 或 JDBC 实现。
- `UserTableInMemory.scala`：in-memory 用户数据访问。
- `UserTableJdbc.scala`：JDBC facade。
- `UserTableJdbcSchema.scala`：`users` 表初始化。
- `UserTableJdbcRead.scala`：JDBC 查询。
- `UserTableJdbcWrite.scala`：JDBC 写入。
- `UserTableCodec.scala`：ResultSet 到 `UserRow` 的映射。

`UserTable.initialize(connection)` 会执行：

```sql
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
)
```

`UserTable` 当前所有公开方法都会根据 connection 类型选择执行路径：

- `connection == null`：当前 in-memory session，继续访问 `InMemoryStore.users`。
- 真实 JDBC connection：使用 `PreparedStatement` 执行 PostgreSQL SQL。

已实现 SQL 的方法：

- `listAll(connection)`
- `findById(connection, userId)`
- `findByUsername(connection, username)`
- `countByRole(connection, role)`
- `insert(connection, row)`

### Level Tables 文件拆分

`level/tables` 已按职责拆分：

- `LevelRows.scala`：保存 `LevelRow`、`RatingRow`、`CommentRow`、`SubmissionRow`。
- `LevelTable.scala`：关卡表对外 facade，根据 connection 分发到 in-memory 或 JDBC 实现。
- `LevelTableInMemory.scala`：in-memory 关卡数据访问。
- `LevelTableJdbc.scala`：JDBC facade。
- `LevelTableJdbcSchema.scala`：`levels` 表初始化。
- `LevelTableJdbcRead.scala`：JDBC 查询。
- `LevelTableJdbcInsert.scala`：JDBC 插入。
- `LevelTableJdbcUpdate.scala`：JDBC 状态与评分统计更新。
- `LevelTableJdbcWrite.scala`：JDBC 写入 facade。
- `LevelTableCodec.scala`：tag/data 编解码和 ResultSet 到 `LevelRow` 的映射。
- `RatingTable.scala`：评分相关 table 方法。
- `RatingTableInMemory.scala`：in-memory 评分数据访问。
- `RatingTableJdbc.scala`：JDBC facade。
- `RatingTableJdbcSchema.scala`：`ratings` 表初始化。
- `RatingTableJdbcRead.scala`：JDBC 查询。
- `RatingTableJdbcWrite.scala`：JDBC 插入和分数更新。
- `RatingTableCodec.scala`：ResultSet 到 `RatingRow` 的映射。
- `CommentTable.scala`：评论相关 table 方法。
- `CommentTableInMemory.scala`：in-memory 评论数据访问。
- `CommentTableJdbc.scala`：JDBC facade。
- `CommentTableJdbcSchema.scala`：`comments` 表初始化。
- `CommentTableJdbcRead.scala`：JDBC 查询。
- `CommentTableJdbcWrite.scala`：JDBC 插入和删除。
- `CommentTableCodec.scala`：ResultSet 到 `CommentRow` 的映射。
- `SubmissionTable.scala`：投稿审核相关 table 方法。
- `SubmissionTableInMemory.scala`：in-memory 投稿数据访问。
- `SubmissionTableJdbc.scala`：JDBC facade。
- `SubmissionTableJdbcSchema.scala`：`submissions` 表初始化。
- `SubmissionTableJdbcRead.scala`：JDBC 查询。
- `SubmissionTableJdbcWrite.scala`：JDBC 写入和审核更新。
- `SubmissionTableCodec.scala`：ResultSet 到 `SubmissionRow` 的映射。
- `FavoriteTable.scala`：收藏相关 table 方法。

### `LevelTable` JDBC 实现

`LevelTable.initialize(connection)` 会执行：

```sql
CREATE TABLE IF NOT EXISTS levels (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  tags TEXT NOT NULL,
  data TEXT NOT NULL,
  author_id TEXT NOT NULL REFERENCES users(id),
  status TEXT NOT NULL,
  rejection_reason TEXT,
  average_rating DOUBLE PRECISION NOT NULL,
  rating_count INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  published_at TEXT
)
```

第一阶段存储约定：

- `tags`：以逗号分隔的 `LevelTag.value` 字符串保存。
- `data`：以 JSON 字符串保存，读取时通过 Circe parser 解码为 `LevelData`。
- `status`：保存 `LevelStatus.value`。

已实现 SQL 的方法：

- `findById(connection, levelId)`
- `listPublished(connection, tag, sort)`
- `listPublishedByAuthor(connection, authorId)`
- `nextId(connection)`
- `insert(connection, row)`
- `updateSubmissionStatus(connection, ...)`
- `updateReviewStatus(connection, ...)`
- `updateRatingStats(connection, ...)`

这些方法仍保留 `connection == null` 的 in-memory fallback，默认启动模式不受影响。

### `CommentTable` JDBC 实现

`CommentTable.initialize(connection)` 会执行：

```sql
CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  level_id TEXT NOT NULL REFERENCES levels(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TEXT NOT NULL
)
```

已实现 SQL 的方法：

- `listAllForAdmin(connection)`
- `listRecentByUser(connection, userId, limit)`
- `listByLevel(connection, levelId)`
- `nextId(connection)`
- `insert(connection, row)`
- `deleteById(connection, commentId)`

这些方法仍保留 `connection == null` 的 in-memory fallback，默认启动模式不受影响。

### `RatingTable` JDBC 实现

`RatingTable.initialize(connection)` 会执行：

```sql
CREATE TABLE IF NOT EXISTS ratings (
  id TEXT PRIMARY KEY,
  level_id TEXT NOT NULL REFERENCES levels(id),
  player_id TEXT NOT NULL REFERENCES users(id),
  score INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (level_id, player_id)
)
```

已实现 SQL 的方法：

- `countByPlayer(connection, playerId)`
- `findByLevelAndPlayer(connection, levelId, playerId)`
- `listByLevel(connection, levelId)`
- `nextId(connection)`
- `insert(connection, row)`
- `updateScore(connection, ratingId, score, updatedAt)`

这些方法仍保留 `connection == null` 的 in-memory fallback，默认启动模式不受影响。

### `SubmissionTable` JDBC 实现

`SubmissionTable.initialize(connection)` 会执行：

```sql
CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY,
  level_id TEXT NOT NULL REFERENCES levels(id),
  submitter_id TEXT NOT NULL REFERENCES users(id),
  status TEXT NOT NULL,
  reviewer_id TEXT REFERENCES users(id),
  review_note TEXT,
  submitted_at TEXT NOT NULL,
  reviewed_at TEXT
)
```

已实现 SQL 的方法：

- `listPending(connection)`
- `hasPendingForLevel(connection, levelId)`
- `nextId(connection)`
- `insert(connection, row)`
- `findById(connection, submissionId)`
- `updateReview(connection, ...)`

这些方法仍保留 `connection == null` 的 in-memory fallback，默认启动模式不受影响。

## Objects 层

objects 层只描述数据结构，不放业务流程。

主要对象：

- `user/objects/BackendUser.scala`
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

1. 在有 Docker 的环境中启动 `docker compose up -d postgres`。
2. 设置 `UGC_DATABASE_MODE=jdbc` 后跑通完整接口回归。
3. 再按需要决定是否保留 in-memory 作为默认模式。
