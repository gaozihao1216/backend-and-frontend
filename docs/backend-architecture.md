# 后端架构

## 技术栈

- **Scala 3** + **http4s** + **cats-effect**
- **Circe**：JSON 编解码
- **PostgreSQL / JDBC**（可选）+ **InMemoryStore**（默认）
- 单进程 monolith：逻辑按模块拆分，统一部署为一个 http4s 服务

入口：`backend/microservice/src/Main.scala`，默认监听 `127.0.0.1:3000`。

更详细的 API 列表与 APIMessage 示例见 `backend/backend_ReadMe.md`。

## 顶层结构

```text
backend/microservice/src/
├── Main.scala
├── routes/              # 根路由挂载（ApiRouter、HealthRouter）
├── infrastructure/      # 纯技术基础设施
│   ├── api/             # APIMessage、APIWithTokenMessage
│   ├── database/        # DatabaseConfig、DatabaseSession、Connection
│   └── http/            # HttpError、AuthMiddleware、统一错误响应
├── core/                # 跨模块业务装配（AccessControl、RowMappers 等）
├── system/              # 健康检查、枚举、种子数据
├── user/                # 用户身份、绑定、资料、AccessControl
├── level/               # 关卡 CRUD、提交、玩家读/写
├── admin/               # 审核、评论管理、总监能力
├── ui/                  # UI 页面/组件/模板定制 API
├── bird/                # 设计师鸟类设计与审核
└── player/              # 玩家运行时（商店、社交、备战、UI 数据）
```

每个业务模块通常包含：

| 目录 | 职责 |
| --- | --- |
| `api/` | **仅** `*Api.scala`：`XxxAPIMessage` + `plan` 编排（鉴权 → 校验 → support → 表读写） |
| `body/` | HTTP 请求 DTO（Circe + `EntityDecoder`）；`routes` 与 `api` 共同引用 |
| `validation/` | 字段/结构校验：`validate*` → `PlanStep.Step`，`check*` 供单元测试 |
| `objects/` | 领域对象（case class + Circe codec）；JSON 辅助如 `PlayerSocialJson` |
| `support/` | 可复用业务规则（查表、状态机）：`require*` / `check*` |
| `routes/` | HTTP 解析（path/header/body），构造 APIMessage 并 `run` |
| `tables/` | 数据访问；`*Row` + Table 门面；in-memory 内联于 Table，JDBC 在 `jdbc/*TableJdbc.scala` |
| `runtime/` / `preparation/` | player 模块专属运行时/备战逻辑（**不是** domain 类型） |

**类型分层（目录规范）** — 完整说明、依赖图与新增 API 清单见 [`backend/microservice/MODULE-LAYOUT.md`](../backend/microservice/MODULE-LAYOUT.md)；领域对象子包见 [`OBJECTS.md`](../backend/microservice/OBJECTS.md)。

| 层 | 路径 | 做什么 | 不做什么 |
| --- | --- | --- | --- |
| `objects/` | `<module>/objects/` | 领域模型、枚举、错误码、API 返回类型 | SQL、路由、`EntityDecoder` |
| `body/` | `<module>/body/<子域>/` | 入站 JSON 形状；`req.as[XxxBody]` | 权限、写表、业务流程 |
| `validation/` | `<module>/validation/<子域>/` | 基于 body/objects 的字段校验 | 访问 `Connection` / Table |
| `support/` | `<module>/support/<子域>/` | 跨步骤可复用的查表与状态规则 | 定义 APIMessage |
| `api/` | `<module>/api/<子域>/` | 仅 `*Api.scala`，`plan` 串联上述层 | body/validation 子目录、`object` 伴生 |
| `tables/` | `<module>/tables/` | `*Row` 与持久化；`Row ↔ objects` | HTTP 类型 |

**一次请求的数据流：**

```text
routes  ──解析 JSON──►  body/
   │
   └──► api/*Api.plan ──► AccessControl → validation → support → tables → objects（返回）
```

示例路径：`CreateLevelBody` → `level/body/design/`；`CreateLevelValidation` → `level/validation/design/`；`LevelDesignAccess` → `level/support/design/`；`UiPageAccess` → `ui/support/pages/`；`PlayerSocialAccess` → `player/support/social/`；`PlayerPreparationAccess` → `player/preparation/`。

## APIMessage 模式

所有 API 遵循统一执行协议：

```scala
final case class AddFriendAPIMessage(userId: String, friendUserId: String) extends APIWithTokenMessage[Json] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, Json]] =
    PlanSteps.finish {
      for {
        _ <- AccessControl.requireRole(connection, userId, UserRole.Player)
        _ <- PlayerSocialAccess.requireValidFriendRequest(userId, friendUserId)
        _ <- PlayerSocialAccess.requireExistingUser(connection, friendUserId)
        _ <- PlanSteps.read(PlayerFriendTable.insertPair(connection, userId, friendUserId))
        // ... 组装好友列表 JSON
      } yield PlayerSocialJson.toJsonFriends(...)
    }
}
```

`PlanStep` / `PlanSteps`（`EitherT[IO, HttpError, A]`）把 plan 写成可读的步骤剧本：

| 步骤来源 | 返回类型 | 用途 |
| --- | --- | --- |
| `AccessControl.requireRole` / `requireAdminLevel` / `requireBoundIdentity` / `requireKnownUser` | `PlanStep.Step[A]` | 鉴权与用户存在校验 |
| `*Validation.validate*` / `ensureKind` | `PlanStep.Step[A]` | 请求体/领域字段校验 |
| `*Support.require*` / `*Access.require*` | `PlanStep.Step[A]` | 查表、状态机、写结果校验（如 `LevelApiSupport`、`BirdDesignAccess`、`UiPageAccess`） |
| `PlanSteps.read` / `blocking` | `PlanStep.Step[A]` | APIMessage 内仅剩的 IO 副作用（表读写、阻塞 JDBC） |
| `PlanSteps.finish` | `IO[Either[HttpError, A]]` | plan 出口 |

`PlanSteps.require` / `attempt` 仍作为 `PlanStep.fromEither` 的基础设施封装保留（测试与内部实现可用），**APIMessage 禁止直接调用**；同步 `Either` 逻辑应落在各模块的 `check*` 方法中，经 `require*` 注入步骤链。

原则：

- Route 只做 HTTP 解析，不写业务规则；**禁止**在 route 内直接 `withTransaction` 或调用 service
- `plan(connection)` 内完成权限、校验、table 调用；**禁止**内联 `PlanSteps.require(Either(...))` 或手写 `Left`/`toRight` 校验块
- `APIMessage.run` 调用 `DatabaseSession.withTransactionEither`：`Right` 提交，`Left` 回滚（无异常驱动控制流）
- 返回 `IO[Either[HttpError, A]]`，由 `HttpError.fromEither` 转为 HTTP 响应
- 成功体包装为 `ApiSuccess(data)`，失败为 `ApiFailure(error)`

## 路由挂载与鉴权

`ApiRouter.scala` 将模块路由组合如下：

| 前缀 | 模块 | 鉴权 |
| --- | --- | --- |
| `/health` | system | 公开 |
| `/auth` | user（身份绑定） | 公开 |
| `/users` | user（资料聚合） | 需 `x-user-id` |
| `/designer` | level（设计师）+ bird | 需 `x-user-id` |
| `/player` | level（玩家读/写）+ player（ui/social/preparation） | 需 `x-user-id` |
| `/admin/director/ui` | ui 定制 | 需 `x-user-id` |
| `/admin` | admin（审核、评论、总监配置） | 需 `x-user-id` |

受保护前缀由 **`AuthMiddleware.requireUserId`** 统一拦截：缺少 `x-user-id` 时返回 401。Route 内通过 `AuthMiddleware.userIdFromRequest(req).get` 读取当前用户，**不在 route 内重复 401 分支**。

认证上下文通过请求头 **`x-user-id`** 传递；后端不信任 body 中的用户身份字段。受保护路由应调用 **`APIWithTokenMessage.runAuthenticated(headerUserId, session)`**，在 plan 执行前校验 header 与 `token` 一致（`USER_ID_MISMATCH`）。角色与管理员等级校验仍在 APIMessage 的 `plan` 内通过 `AccessControl` 完成。

JDBC 模式下，`SystemDefaults.initializeDatabaseOn` 在 DDL 之后调用 **`SystemJdbcSeedData.seed`**，写入与 in-memory `SystemDemoData` 一致的关卡、投稿、评分、评论与 UI 模板演示数据。

## 权限模型

- `AccessControl.requireRole(connection, userId, role)`：校验 player / designer / admin（返回 `PlanStep.Step[UserRow]`）
- `AccessControl.requireAdminLevel(connection, userId, AdminLevel.Standard | Director)`：管理员分级（返回 `PlanStep.Step[UserRow]`）
- `AccessControl.requireKnownUser(connection, userId)`：仅校验用户存在（不限 role，用于玩家读 UI 页、资料查询等）
- `AccessControl.checkRole` / `checkAdminLevel` / `checkBoundIdentity` / `checkKnownUser`：同步 `Either` 实现，供单元测试与 IO 步骤复用
  - **Standard**：关卡/鸟类投稿审核、评论管理
  - **Director**：UI 定制、关卡槽位分配、鸟类技能配置等

`AdminLevel` 定义在 `system/objects/AdminLevel.scala`，用户表字段 `admin_level` 仅对 `role = admin` 有效。

## 存储层

### 默认：In-Memory

- 启动时使用 `DatabaseSession.inMemory`
- 种子数据由 `SystemSeedData` 注入（演示关卡、用户、模板等）
- 适合本地开发与课程演示，重启后 in-memory 状态重置（除非改 seed）

### 可选：PostgreSQL/JDBC

```bash
npm run postgres:up
npm run dev:backend:postgres
```

或手动指定环境变量：

```bash
UGC_DATABASE_MODE=jdbc \
UGC_DATABASE_URL=jdbc:postgresql://localhost:5432/ugc_level_platform \
UGC_DATABASE_USERNAME=postgres \
UGC_DATABASE_PASSWORD=postgres \
sbt run
```

- 初始化脚本：`backend/docker/init-store.sql`
- 主要业务表在 Table 门面内直接读写 `InMemoryStore`（`connection == null`），JDBC 路径调用同目录下合并后的 `*TableJdbc` 对象（无 JdbcRead/Write/Schema 多层转发）
- 修改 init SQL 后需 `docker compose down -v` 重建数据卷

## 模块说明

### system

通用枚举与 API 包装：`UserRole`、`LevelStatus`、`SubmissionStatus`、`ApiSuccess`、`ApiFailure`、`ErrorBody`。

### user

统一用户模块，内部分 **identity**（身份）与 **profile**（资料聚合）两层：

**身份 / 绑定**（路由前缀 `/auth`，兼容前端现有路径）：

- `GET /auth/backend-users`：列出可绑定的演示账号
- `POST /auth/bind`：前端本地 ID 绑定到后端用户（创建或复用 UserRow）

**资料**（路由前缀 `/users`）：

- `GET /users/:userId/profile`：资料页聚合（发布关卡、评论、统计）

**共享能力**：

- `tables/user/`：`UserTable` 持久化；用户资料聚合由 `user/support/UserProfileAccess` 经 `level/api/internal/user/` 拉取 level 侧数据
- `utils/AccessControl.scala`：全项目共用的 `requireRole` / `requireAdminLevel` / `requireKnownUser`（IO 步骤）与 `check*`（同步校验）
- `support/UserProfileAccess.scala`、`validation/BindBackendUserValidation.scala`

### level

设计师：

- `POST /designer/levels`：创建关卡（status = draft）
- `POST /designer/submissions`：提交审核

玩家：

- 已发布关卡列表/详情、评分、收藏、评论

目录按角色与数据域分子包（`body`/`validation` 与 `api` 同级，不在 `api/` 下）：

```text
level/
├── api/
│   ├── design/                # CreateLevelApi、SubmitLevelApi
│   └── player/
│       ├── read/              # 已发布关卡、评论、收藏列表
│       └── action/            # 评分、收藏、评论写入
├── body/
│   ├── design/                # CreateLevelBody、SubmitLevelBody
│   └── player/                # RateLevelBody、CreateCommentBody
├── validation/
│   └── design/                # CreateLevelValidation
├── objects/
│   ├── level/                 # Level、LevelData、GameWorld
│   ├── terrain/               # 地形、障碍物、敌人
│   ├── submission/            # Submission、SubmissionWithLevel
│   ├── social/                # Rating、LevelComment、Favorite
│   ├── inventory/             # BirdInventory、BirdPool
│   └── errors/                # CreateLevelErrors
├── support/
│   ├── design/LevelDesignAccess.scala
│   └── player/LevelApiSupport.scala
├── routes/
└── tables/
```

### admin

普通管理员（Standard）：

- 待审核关卡/鸟类、审核操作、评论列表与删除
- 审核审计日志查询（`GET /admin/audit-logs`）
- 商店商品 CRUD（`GET/POST/PUT/DELETE /admin/shop/items`）

总监（Director）：

- 关卡槽位分配、鸟类技能板、权限转移等（`/admin/director/*` 部分路径）

目录按业务域分子包（与 `player/`、`ui/` 一致）：

```text
admin/
├── api/
│   ├── comments/
│   ├── audit/
│   ├── shop/
│   ├── submissions/
│   └── director/
│       ├── permissions/
│       ├── level_assignment/
│       └── bird_skill/
├── body/
│   ├── shop/                  # CreateShopItemBody、UpdateShopItemBody
│   ├── submissions/           # ReviewSubmissionBody
│   └── director/
│       ├── permissions/
│       ├── level_assignment/
│       └── bird_skill/
├── validation/
│   └── shop/                  # AdminShopItemValidation
├── objects/
├── support/
│   ├── comments/
│   ├── shop/
│   ├── submission/
│   └── director/
├── routes/
└── tables/                    # AdminAuditTable、jdbc/…
```

### ui

总监专用，挂载在 `/admin/director/ui`：

- UI 页面 CRUD（`page.PageConfig`）
- 页面组件、按钮模板、拉伸视觉模板
- 共享关卡地图页配置

`objects/` 按子域分子包：`component/`、`button_template/`、`category/`、`stretch_template/`、`page/`；根目录保留 `UiEndpoint`、`UiCustomizationErrors`。

`ui/support/` 与 `UiPagePublishSupport` 承载页面/组件/模板的 `require*` + `check*` 逻辑（如 `UiPageAccess`、`UiPageComponentAccess`、`ButtonTemplateAccess`）；签到面板奖励注册已迁至 `player/api/internal/ui/`。

### bird

设计师创建/编辑/提交鸟类设计；管理员审核鸟类投稿。

`tables/design/`、`tables/submission/`、`tables/skill_config/` 等均采用 **Table 门面 + 单个 `jdbc/*TableJdbc.scala`** 结构（in-memory 逻辑内联于 Table，经 `TableConnection.isInMemory` 分流）。

目录按生命周期分子包：

```text
bird/
├── api/
│   ├── design/                # CRUD + Submit（仅 *Api.scala）
│   └── review/
├── body/
│   ├── design/                # CreateBirdDesignBody、UpdateBirdDesignBody
│   └── review/                # ReviewBirdSubmissionBody
├── validation/
│   └── design/                # BirdDesignValidation
├── objects/
├── support/
│   ├── design/
│   └── review/
├── routes/
└── tables/
```

### player

挂载在 `/player` 下若干子路径，业务均通过 `player/api/` 或 `level/api/` 的 APIMessage 执行：

- **ui runtime**：`player/api/ui/` — 动态 UI 数据与动作；关卡地图页走 `ui/api/pages/`
- **social**：`player/api/social/` — 好友与私信；校验逻辑在 `player/support/social/PlayerSocialAccess`
- **preparation**：`player/api/preparation/` — 鸟/弹弓备战升级
- **levels / favorites**：`level/api/` — 已发布关卡读/写（挂载在同一 `/player` 前缀下）

`tables/preparation/`、`tables/social/`、`tables/shop/` 使用相同 Table + `*TableJdbc` 模式；管理员可通过 `GET/POST/PUT/DELETE /admin/shop/items` 维护商品目录。

## API 文件约定

- 后端：`backend/microservice/src/<module>/api/<子路径>/*Api.scala`
- 前端：`frontend/src/api/<module>/<子路径>/*Api.ts`（与后端子路径一致，见 [`frontend/src/api/ARCHITECTURE.md`](../frontend/src/api/ARCHITECTURE.md)）
- **文件名与子目录一一对应**；例外：`GetBackendUsersApi` / `BindBackendUserApi` 在前端位于 `api/auth/`（路由前缀 `/auth`）
- HTTP method 与 path 说明维护在文档中，不在 Scala 里写未使用的 `*Endpoint` object
- 前端 `api-alignment.test.ts` 在 CI/本地 `npm test` 中校验布局对齐

## 响应格式

成功：

```json
{ "success": true, "data": { ... } }
```

失败：

```json
{ "success": false, "error": { "code": "...", "message": "..." } }
```

前端 Zod schema 与后端 `ApiSuccess` / `ApiFailure` 结构对齐。

## 本地开发命令

```bash
npm run dev                 # in-memory 后端 + 前端
npm run dev:postgres        # Postgres + JDBC 后端 + 前端
npm run dev:backend         # sbt run（默认 in-memory）
npm run dev:backend:watch   # sbt ~run
npm run dev:backend:postgres # JDBC 模式
npm run postgres:up         # 启动 Docker Postgres
sbt compile
sbt test                    # Scala 测试
```
