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
| `api/` | `XxxAPIMessage`：权限、校验、业务流程、调用 tables |
| `objects/` | 领域对象（case class + Circe codec）；JSON 辅助如 `PlayerSocialJson` |
| `routes/` | HTTP 解析（path/header/body），构造 APIMessage 并 `run` |
| `tables/` | 数据访问；`*Row` case class + Table 门面；inmemory 与 jdbc 双实现 |
| `runtime/` / `preparation/` / `support/` | 模块内业务辅助（**不是** domain 类型，不放 `objects/`） |

**类型分层（老师反馈后的约定）**

- `objects/`：纯数据模型与序列化（如 `PlayerWallet`、`CheckInSlotReward`、`HealthResponse`）
- `api/`：仅 `XxxAPIMessage`；HTTP 请求 DTO 放在同目录 `XxxBody.scala` / `XxxRequest.scala`
- `tables/`：仅 `*Row` 与 Table 门面；Row 与 domain 对象分离，Table 负责 `Row ↔ objects` 映射
- `runtime/`、`preparation/`、`validation/`、`admin/support/`：可复用逻辑与服务，import `objects/` 中的类型

示例：`PlayerPreparationSupport` 留在 `player/preparation/`，`PlayerRuntimeDefaults` / `PlayerWeeklyCheckInService` 留在 `player/runtime/`；`CreateLevelBody` 等在 `level/api/design/` 独立文件；`BirdSkillConfigRow` + `BirdSkillConfigRowMapper` 在 `bird/tables/skill_config/`。

## APIMessage 模式

所有 API 遵循统一执行协议：

```scala
final case class ListFriendsAPIMessage(userId: String) extends APIWithTokenMessage[Json] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, Json]] =
    PlanSteps.finish {
      for {
        _ <- PlanSteps.require(AccessControl.requireRole(connection, userId, UserRole.Player))
        friendIds <- PlanSteps.read(PlayerFriendTable.listFriendUserIds(connection, userId))
        friends <- PlanSteps.read(/* join UserTable → summaries */)
      } yield PlayerSocialJson.toJsonFriends(PlayerFriendListResponse(friends))
    }
}
```

`PlanSteps`（`EitherT[IO, HttpError, A]`）把 plan 写成可读的步骤剧本：`require` 校验/鉴权、`read` 同步表读写、`blocking` 阻塞 IO、`finish` 产出 `IO[Either[HttpError, A]]`。

原则：

- Route 只做 HTTP 解析，不写业务规则；**禁止**在 route 内直接 `withTransaction` 或调用 service
- `plan(connection)` 内完成权限、校验、table 调用
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

- `AccessControl.requireRole(connection, userId, role)`：校验 player / designer / admin
- `AccessControl.requireAdminLevel(connection, userId, AdminLevel.Standard | Director)`：管理员分级
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
- 主要业务表已提供 jdbc + inmemory 双实现
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

- `tables/user/`：`UserTable`、`UserRow` 持久化（in-memory / JDBC）
- `utils/AccessControl.scala`：全项目共用的 `requireRole` / `requireAdminLevel`

### level

设计师：

- `POST /designer/levels`：创建关卡（status = draft）
- `POST /designer/submissions`：提交审核

玩家：

- 已发布关卡列表/详情、评分、收藏、评论

目录按角色与数据域分子包：

```text
level/
├── api/
│   ├── design/                # 设计师创建与提交
│   │   ├── CreateLevelApi.scala / Body
│   │   └── SubmitLevelApi.scala / Body
│   └── player/
│       ├── read/              # 已发布关卡、评论、收藏列表
│       └── action/            # 评分、收藏、评论写入
├── objects/
│   ├── level/                 # Level、LevelData、GameWorld
│   ├── terrain/               # 地形、障碍物、敌人（Position、LevelGround 等）
│   ├── submission/            # Submission、SubmissionWithLevel
│   ├── social/                # Rating、LevelComment、Favorite 等
│   ├── inventory/             # BirdInventory、BirdPool
│   └── errors/                # CreateLevelErrors
├── support/player/            # LevelApiSupport（已发布关卡校验）
├── routes/                    # DesignerLevelRouter、PlayerLevel*Router
└── tables/                    # level / submission / rating / comment / favorite / slot_assignment
```

### admin

普通管理员（Standard）：

- 待审核关卡/鸟类、审核操作、评论列表与删除

总监（Director）：

- 关卡槽位分配、鸟类技能板、权限转移等（`/admin/director/*` 部分路径）

目录按业务域分子包（与 `player/`、`ui/` 一致）：

```text
admin/
├── api/
│   ├── comments/              # 评论管理
│   │   ├── DeleteCommentApi.scala
│   │   └── GetAdminCommentsApi.scala
│   ├── submissions/           # 关卡投稿审核
│   │   ├── GetPendingSubmissionsApi.scala
│   │   ├── ReviewSubmissionApi.scala
│   │   └── ReviewSubmissionBody.scala
│   └── director/
│       ├── permissions/       # 总监权限转移
│       │   ├── GetDirectorPermissionsApi.scala
│       │   ├── TransferDirectorPermissionApi.scala
│       │   └── TransferDirectorPermissionBody.scala
│       ├── level_assignment/  # 关卡槽位分配
│       │   ├── DirectorLevelAssignmentApi.scala
│       │   └── DirectorLevelAssignmentBodies.scala
│       └── bird_skill/        # 鸟类技能配置
│           ├── DirectorBirdSkillApi.scala
│           └── SaveDirectorBirdSkillBody.scala
├── objects/
│   ├── submission/            # 审核结果与错误码
│   └── director/
│       ├── permissions/
│       └── level_assignment/
├── support/director/            # 看板组装、校验等可复用逻辑
│   ├── level_assignment/
│   └── bird_skill/
├── routes/AdminRouter.scala
└── tables/AdminAuditTable.scala
```

### ui

总监专用，挂载在 `/admin/director/ui`：

- UI 页面 CRUD（`PageConfig`）
- 页面组件、按钮模板、拉伸视觉模板
- 共享关卡地图页配置

### bird

设计师创建/编辑/提交鸟类设计；管理员审核鸟类投稿。

目录按生命周期分子包：

```text
bird/
├── api/
│   ├── design/                # 设计师 CRUD + 提交
│   │   ├── CreateBirdDesignApi.scala / Body
│   │   ├── UpdateBirdDesignApi.scala / Body
│   │   ├── ListBirdDesignsApi.scala（含 DeleteBirdDesignAPIMessage）
│   │   ├── SubmitBirdDesignApi.scala
│   │   └── BirdDesignInputBody.scala
│   └── review/                # 管理员审核
│       ├── GetPendingBirdSubmissionsApi.scala
│       ├── ReviewBirdSubmissionApi.scala
│       └── ReviewBirdSubmissionBody.scala
├── objects/
│   ├── design/BirdDesign.scala
│   ├── submission/            # BirdSubmission、ReviewedBirdSubmission 等
│   └── skill/                 # BirdSkillConfig、DirectorBirdSkillBoard/Entry
├── validation/design/         # BirdDesignValidation
├── routes/DesignerBirdRouter.scala
└── tables/
    ├── design/
    ├── submission/
    ├── skill_config/
    └── shared/                # BirdRowMapper、BirdRows
```

### player

挂载在 `/player` 下若干子路径，业务均通过 `player/api/` 或 `level/api/` 的 APIMessage 执行：

- **ui runtime**：`player/api/ui/` — 动态 UI 数据与动作；关卡地图页走 `ui/api/pages/`
- **social**：`player/api/social/` — 好友与私信
- **preparation**：`player/api/preparation/` — 鸟/弹弓备战升级
- **levels / favorites**：`level/api/` — 已发布关卡读/写（挂载在同一 `/player` 前缀下）

## API 文件约定

- 后端：`backend/microservice/src/**/api/*Api.scala`（或 `*APIMessage.scala`）
- 前端：`frontend/src/api/**/*Api.ts`
- **文件名一一对应**，便于跨端追踪
- HTTP method 与 path 说明维护在文档中，不在 Scala 里写未使用的 `*Endpoint` object

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
