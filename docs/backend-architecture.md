# 后端架构

## 技术栈

- **Scala 3** + **http4s** + **cats-effect**
- **Circe**：JSON 编解码
- **PostgreSQL / JDBC**
- 单进程 monolith：逻辑按模块拆分，统一部署为一个 http4s 服务

入口：`backend/microservice/src/Main.scala`，默认监听 `127.0.0.1:3000`。

更详细的 API 列表与 APIMessage 示例见 `backend/backend_ReadMe.md`。

## 顶层结构

```text
backend/microservice/src/
├── Main.scala
├── routes/              # 系统健康检查与 APIMessage 统一入口（ApiRouter、HealthRouter、*ApiMessages）
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
| `api/` | **仅** `*Api.scala`：`XxxAPIMessage` + `plan` 编排（鉴权 → 校验 → 私有步骤 → 表读写） |
| `validation/` | 字段/结构校验：`validate*` 返回 `IO[Either[HttpError, A]]` |
| `objects/` | 领域对象、请求对象、响应对象、错误对象、Circe codec |
| `support/` | 多 API 复用辅助：mapping、seed、bootstrap、catalog、defaults、动态分派等 |
| `routes/` | 模块 APIMessage 注册表；业务 HTTP 入口统一走 `POST /api/{apiName}` |
| `tables/` | 数据访问；`*Row` + `*Table.scala` 读写入口 + `*TableInitializer.scala` DDL/seed |
| `support/*` / `preparation/` | player 模块内多 API 复用的商店、签到、进度、钱包、备战辅助能力 |

**类型分层（目录规范）** — 完整规范见 [`backend-structure-standard.md`](./backend-structure-standard.md)；后端目录入口见 [`backend/microservice/MODULE-LAYOUT.md`](../backend/microservice/MODULE-LAYOUT.md)；领域对象子包见 [`OBJECTS.md`](../backend/microservice/OBJECTS.md)。

| 层 | 路径 | 做什么 | 不做什么 |
| --- | --- | --- | --- |
| `objects/` | `<module>/objects/` | 领域模型、枚举、错误码、API 返回类型、请求对象 | SQL、路由 |
| `validation/` | `<module>/validation/<子域>/` | 基于 objects 的字段校验 | 访问 `Connection` / Table |
| `support/` | `<module>/support/<子域>/` | 多 API 复用辅助、mapping、seed、bootstrap、catalog、defaults | 单 API 专用流程 |
| `api/` | `<module>/api/<子域>` | 仅 `*Api.scala`，`plan` 串联业务步骤 | validation/support 子目录、请求对象 |
| `tables/` | `<module>/tables/` | `*Row` 与持久化；`Row ↔ objects` | HTTP 类型 |

**一次请求的数据流：**

```text
routes  ──解析 JSON──►  objects/
   │
   └──► api/*Api.plan ──► AccessControl → validation → private helpers/support → tables → objects（返回）
```

示例路径：`CreateLevelRequest` → `level/objects/design/request/`；`CreateLevelValidation` → `level/validation/design/`；单 API 专用查表/状态判断放在对应 `*Api.scala` 私有方法中；多 API 复用逻辑可保留在 `UiPageAccess`、`PlayerPreparationSupport` 等 support 文件。

## APIMessage 模式

所有 API 遵循统一执行协议：

```scala
final case class AddFriendAPIMessage(userId: String, friendUserId: String) extends APIWithTokenMessage[Json] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, Json]] =
    PlanSteps.finish {
      for {
        _ <- PlanSteps.fromEither(AccessControl.requireRole(connection, userId, UserRole.Player))
        _ <- requireValidFriendRequest
        _ <- PlanSteps.runApi(UserExistsInternalAPIMessage(friendUserId), connection).map(_ => ())
        _ <- PlanSteps.read(PlayerFriendTable.insertPair(connection, userId, friendUserId))
        // ... 组装好友列表 JSON
      } yield PlayerSocialJson.toJsonFriends(...)
    }
}
```

`PlanSteps` 在 API 内部把 `IO[Either[HttpError, A]]` 串成可读流程；普通业务文件不再暴露额外流程类型。

| 来源 | 返回类型 | 用途 |
| --- | --- | --- |
| `AccessControl.requireRole` / `requireAdminLevel` / `requireBoundIdentity` / `requireKnownUser` | `IO[Either[HttpError, A]]` | 鉴权与用户存在校验 |
| `*Validation.validate*` / `ensureKind` | `IO[Either[HttpError, A]]` | 请求体/领域字段校验 |
| `*Support.require*` / `*Access.require*` | `IO[Either[HttpError, A]]` | 多 API 复用能力 |
| API 文件内私有 `require*` / `build*` | `EitherT[IO, HttpError, A]` 或纯值 | 单 API 专用查表、状态机、写结果校验 |
| `PlanSteps.read` / `blocking` | `EitherT[IO, HttpError, A]` | APIMessage 内表读写和阻塞 JDBC |
| `PlanSteps.finish` | `IO[Either[HttpError, A]]` | plan 出口 |

APIMessage 中不再引入旧的流程包装类型。support、validation、AccessControl 的边界统一为 `IO[Either]`，API 内通过 `PlanSteps.fromEither(...)` 接入。

原则：

- 健康检查保留 `GET /health`；业务入口统一由 `APIMessageRouter` 分发 `POST /api/{apiName}`
- `plan(connection)` 内完成权限、校验、table 调用；单 API 专用的查表/状态判断优先写成当前 API 文件的私有方法
- `APIMessage.run` 调用 `DatabaseSession.withTransactionEither`：`Right` 提交，`Left` 回滚（无异常驱动控制流）
- 返回 `IO[Either[HttpError, A]]`，由 `HttpError.fromEither` 转为 HTTP 响应
- 成功体包装为 `ApiSuccess(data)`，失败为 `ApiFailure(error)`

## API 入口与鉴权

`ApiRouter.scala` 先挂载系统级 `HealthRouter`，再汇总各模块 `*ApiMessages` 注册表并交给 `APIMessageRouter` 统一分发。外部业务 API 使用 `POST /api/{apiName}`，其中 `apiName` 由 `XxxAPIMessage` 推导为 `xxxapi`。

| 注册表 | 模块 |
| --- | --- |
| `UserApiMessages` | user（身份绑定、资料聚合） |
| `LevelRoutes` | level（设计师创建/提交、玩家读写） |
| `BirdApiMessages` | bird（鸟类设计与审核） |
| `PlayerApiMessages` | player（ui/social/preparation） |
| `AdminApiMessages` | admin（审核、评论、总监配置） |
| `UiApiMessages` | ui 定制 |

健康检查是例外：`GET /health` 直接返回 `HealthResponse`，用于前端 dev proxy、负载均衡和运维探针。

公开 API 使用 `RegisteredAPIMessage.publicApi`；受保护 API 使用 `protectedApi`。认证上下文通过请求头 **`x-user-id`** 传递；`APIMessageRouter` 读取该 header，并由 `protectedApi` 在进入 `plan` 前调用 `runAuthenticated` 校验 header 与 `token` 一致（`USER_ID_MISMATCH`）。角色与管理员等级校验仍在 APIMessage 的 `plan` 内通过 `AccessControl` 完成。

`SystemDefaults.initializeDatabaseOn` 在 DDL 之后调用 **`SystemJdbcSeedData.seed`**，向 PostgreSQL 幂等写入关卡、投稿、评分、评论与 UI 模板演示数据。

## 权限模型

- `AccessControl.requireRole(connection, userId, role)`：校验 player / designer / admin，返回 `IO[Either[HttpError, UserRow]]`
- `AccessControl.requireAdminLevel(connection, userId, AdminLevel.Standard | Director)`：管理员分级，返回 `IO[Either[HttpError, UserRow]]`
- `AccessControl.requireKnownUser(connection, userId)`：仅校验用户存在（不限 role，用于玩家读 UI 页、资料查询等）
- `AccessControl.checkRole` / `checkAdminLevel` / `checkBoundIdentity` / `checkKnownUser`：同步 `Either` 实现，供单元测试和 `require*` 方法复用
  - **Standard**：关卡/鸟类投稿审核、评论管理
  - **Director**：UI 定制、关卡槽位分配、鸟类技能配置等

`AdminLevel` 定义在 `system/objects/enums/AdminLevel.scala`，用户表字段 `admin_level` 仅对 `role = admin` 有效。

## 存储层

### PostgreSQL/JDBC

```bash
npm run postgres:up
npm run dev:backend
```

或手动指定环境变量：

```bash
UGC_DATABASE_URL=jdbc:postgresql://localhost:5432/ugc_level_platform \
UGC_DATABASE_USERNAME=postgres \
UGC_DATABASE_PASSWORD=postgres \
sbt run
```

- 初始化脚本：`backend/docker/init-store.sql`
- 主要业务表由 `*Table.scala` 接收 JDBC `Connection` 并执行读写；`*TableInitializer.scala` 单独负责建表和启动 seed（无 JdbcRead/Write/Schema 多层转发）
- 修改 init SQL 后需 `docker compose down -v` 重建数据卷

## 模块说明

### system

通用枚举与 API 包装：`UserRole`、`LevelStatus`、`SubmissionStatus`、`ApiSuccess`、`ApiFailure`、`ErrorBody`。

### user

统一用户模块，内部分 **identity**（身份）与 **profile**（资料聚合）两层：

**身份 / 绑定**：

- `GetBackendUsersAPIMessage`：列出可绑定的演示账号
- `BindBackendUserAPIMessage`：前端本地 ID 绑定到后端用户（创建或复用 UserRow）

**资料**：

- `GetUserProfileAPIMessage`：资料页聚合（发布关卡、评论、统计）

**共享能力**：

- `tables/user/`：`UserTable` 持久化；用户资料聚合由 `GetUserProfileApi.plan` 经 `level/api/internal/user/` 拉取 level 侧数据
- `support/AccessControl.scala`：全项目共用的 `requireRole` / `requireAdminLevel` / `requireKnownUser`（`IO[Either]`）与 `check*`（同步校验）
- `support/UserProfileMapping.scala`、`validation/BindBackendUserValidation.scala`

### level

设计师：

- `CreateLevelAPIMessage`：创建关卡（status = draft）
- `SubmitLevelAPIMessage`：提交审核

玩家：

- 已发布关卡列表/详情、评分、收藏、评论

目录按角色与数据域分子包；请求对象归入 `objects/.../request/`：

```text
level/
├── api/
│   ├── design/                # CreateLevelApi、SubmitLevelApi
│   └── player/
│       ├── read/              # 已发布关卡、评论、收藏列表
│       └── action/            # 评分、收藏、评论写入
├── objects/
│   ├── design/request/        # CreateLevelRequest、SubmitLevelRequest
│   ├── player/request/        # RateLevelRequest、CreateLevelCommentRequest
│   ├── level/                 # Level、LevelData、GameWorld
│   ├── terrain/               # 地形、障碍物、敌人
│   ├── submission/            # Submission、SubmissionWithLevel
│   ├── social/                # Rating、LevelComment、Favorite
│   ├── inventory/             # BirdInventory、BirdPool
│   └── errors/                # CreateLevelErrors
├── validation/
│   └── design/                # CreateLevelValidation
├── support/
│   └── seed/
├── routes/
└── tables/
```

### admin

普通管理员（Standard）：

- 待审核关卡/鸟类、审核操作、评论列表与删除
- 审核审计日志查询（`ListAdminAuditLogsAPIMessage`）
- 商店商品 CRUD（`ListAdminShopItemsAPIMessage` 等）

总监（Director）：

- 关卡槽位分配、鸟类技能板、权限转移等（director 相关 APIMessage）

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
├── objects/
│   ├── shop/                  # 商品对象与 Create/Update 请求对象
│   ├── submission/            # 审核对象与 ReviewSubmissionRequest
│   ├── director/              # permissions、level_assignment、bird_skill
│   └── audit/
├── validation/
│   └── shop/                  # AdminShopItemValidation
├── support/
│   ├── comments/
│   ├── shop/
│   ├── submission/
│   └── director/
├── routes/
└── tables/                    # AdminAuditTable、AdminAuditTableInitializer
```

### ui

总监专用，经 `UiApiMessages` 注册：

- UI 页面 CRUD（`page.PageConfig`）
- 页面组件、按钮模板、拉伸视觉模板
- 共享关卡地图页配置

`objects/` 按子域分子包：`component/`、`button_template/`、`category/`、`stretch_template/`、`page/`、`endpoint/`、`errors/`。

`ui/support/` 只保留页面/组件/模板的多 API 复用逻辑（如 `UiPageAccess`、`UiPageComponentAccess`、`ButtonTemplateAccess`）；签到面板奖励注册已迁至 `player/api/internal/ui/`。

### bird

设计师创建/编辑/提交鸟类设计；管理员审核鸟类投稿。

`tables/design/`、`tables/submission/`、`tables/skill_config/` 等均采用 **`*Table.scala` + `*TableInitializer.scala`** 结构。

目录按生命周期分子包：

```text
bird/
├── api/
│   ├── design/                # CRUD + Submit（仅 *Api.scala）
│   └── review/
├── objects/
│   ├── design/                # BirdDesign 与 Create/Update 请求对象
│   ├── submission/            # BirdSubmission 与审核请求对象
│   └── skill/
├── validation/
│   └── design/                # BirdDesignValidation
├── support/
│   ├── catalog/
│   ├── design/
│   ├── director/
│   └── skill_config/
├── routes/
└── tables/
```

### player

玩家能力经 `PlayerApiMessages` 与 `LevelRoutes` 注册，业务均通过 `player/api/` 或 `level/api/` 的 APIMessage 执行：

- **ui runtime**：`player/api/ui/` — 动态 UI 数据与动作；钱包与关卡进度 data key 在 `PlayerUiRuntimeSupport` 内分派
- **social**：`player/api/social/` — 好友与私信；好友/消息校验作为各 API 文件内私有 planner helper
- **preparation**：`player/api/preparation/` — 鸟/弹弓备战升级
- **levels / favorites**：`level/api/` — 已发布关卡读/写

`tables/preparation/`、`tables/social/`、`tables/shop/` 使用相同 `*Table.scala` + `*TableInitializer.scala` 模式；管理员可通过 shop 相关 APIMessage 维护商品目录。

## API 文件约定

- 后端：`backend/microservice/src/<module>/api/<子路径>/*Api.scala`
- 前端：`frontend/src/api/<module>/<子路径>/*Api.ts`（与后端子路径一致，见 [`frontend/src/api/ARCHITECTURE.md`](../frontend/src/api/ARCHITECTURE.md)）
- **文件名与子目录一一对应**；例外：`GetBackendUsersApi` / `BindBackendUserApi` 在前端位于 `api/auth/`
- HTTP 入口由 `APIMessageRouter` 统一维护，不在 Scala 里写未使用的 `*Endpoint` object 或手写 path router
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
npm run dev                 # Postgres + JDBC 后端 + 前端
npm run dev:postgres        # 同 npm run dev
npm run dev:backend         # sbt run（需本地 Postgres）
npm run dev:backend:watch   # sbt ~run
npm run dev:backend:postgres # 兼容别名：sbt run
npm run postgres:up         # 启动 Docker Postgres
sbt compile
sbt test                    # Scala 测试
```
