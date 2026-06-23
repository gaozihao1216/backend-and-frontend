# 业务模块目录布局

本文档说明 `backend/microservice/src/<module>/` 下各子目录的职责、包名约定，以及一次 HTTP 请求在各层之间的流转关系。与 `docs/backend-architecture.md` 互补：后者偏全局架构与路由；本文档偏**单模块内文件应放在哪里**。

## 标准目录树

每个业务模块（`user`、`level`、`admin`、`bird`、`ui`、`player` 等）在 `api/` 之外，按需包含下列目录：

```text
<module>/
├── api/              # 仅 *Api.scala：XxxAPIMessage + plan 编排
├── body/             # HTTP 请求 DTO（Circe + http4s EntityDecoder）
├── validation/       # 字段/请求校验 → PlanStep.Step
├── objects/          # 领域类型（响应体、实体、错误码对象）
├── support/          # 可复用业务规则（require* / check*）
├── routes/           # path/header/body 解析 → 构造 APIMessage
└── tables/           # *Row + Table 门面（in-memory / JDBC）
```

另有模块专属目录（非全模块通用）：

| 目录 | 模块 | 说明 |
| --- | --- | --- |
| `support/bootstrap/` | 各业务模块 | `*StorageBootstrap`：DDL/表初始化，供 `system` 启动编排 |
| `preparation/` | player | 备战升级逻辑（`PlayerPreparationAccess` 等） |
| `runtime/` | player | UI 运行时 data/action 分派 |
| `utils/` | user | `AccessControl`（全项目共用鉴权） |

`infrastructure/api/` 放框架级 `APIMessage`、`PlanStep`、`PlanSteps`，与业务 `*/api/*Api.scala` 不同。

## 各层职责

### `api/` — 仅 APIMessage

- **只放** `*Api.scala`（如 `CreateLevelApi.scala` 内定义 `CreateLevelAPIMessage`）。
- **禁止** 在业务 `api/` 下再放 `body/`、`validation/`、`support/` 子目录或 `object` 伴生块（课程/架构约定：`api` 层只做流程编排）。
- `plan(connection)` 用 `PlanSteps.finish { for { ... } yield ... }` 串联步骤，步骤旁用 `// 步骤 N：` 注释。

### `body/` — 入站 HTTP 请求体

- case class + Circe `Encoder`/`Decoder` + `EntityDecoder`（供 `routes` 里 `req.as[CreateLevelBody]`）。
- 可组合 `objects/` 中的类型（如 `CreateLevelBody` 含 `LevelData`）。
- **不是**领域实体：无业务方法、不写表、不做权限判断。
- 包名：`microservice.<module>.body.<子域>`，例如 `microservice.level.body.design`。

**为何独立于 `api/`？**

1. `routes/` 与 `api/` 都要引用同一请求类型；放在模块级 `body/` 避免 `api` 依赖环。
2. 与 `objects/`（出站/领域）区分：body 是「客户端 POST 进来的形状」，objects 是「业务语义与 API 返回形状」。
3. 满足「`api/` 目录内只有 `*Api.scala`」的目录规范。

### `validation/` — 纯校验

- `validate*(...): PlanStep.Step[A]` 供 `plan` 调用；同步 `check*(...): Either[HttpError, A]` 供单元测试。
- 只依赖 `body`、`objects`、错误码对象，不访问 `Connection`、不调用 Table。
- 包名：`microservice.<module>.validation.<子域>`。

### `objects/` — 领域模型

- 纯数据 case class、枚举、错误码对象；详见 [`OBJECTS.md`](./OBJECTS.md)。
- APIMessage 的**返回类型**与 plan 内组装的 JSON/实体均来自此处（或 `system/objects`）。

### `support/` — 可复用业务规则

- 查表、状态机、组合校验：`require*` → `PlanStep.Step`，`check*` → `Either`。
- 与 `validation/` 区别：support 可读 `Connection`、调 Table 或跨表逻辑；validation 只做字段/结构校验。
- 示例：`level/support/design/LevelDesignAccess.scala`、`ui/support/pages/UiPageAccess.scala`、`admin/support/shop/AdminShopSupport.scala`。

### `routes/` — HTTP 适配

- 解析 path、query、`x-user-id`、JSON body。
- 构造 `XxxAPIMessage(...).runAuthenticated(userId, databaseSession)`。
- **不写**业务规则、**不**直接 `withTransaction` 或调 Table。

### `tables/` — 持久化

- `*Row` 对应存储列；Table 门面提供 `connection` 入参的方法，内部 in-memory / JDBC 分流。
- Row ↔ objects 映射在 Table 或 `*RowMapper` 中，不在 `objects/` 内嵌 SQL。

## 请求流转（依赖方向）

```text
  HTTP 客户端
       │
       ▼
  routes/          req.as[CreateLevelBody]  ──import──►  body/
       │
       ▼
  api/*Api.scala   plan { AccessControl → validation → support → PlanSteps.read(Table) }
       │                    │              │              │
       │                    ▼              ▼              ▼
       │              user/utils    validation/     support/
       │              AccessControl
       ▼
  objects/         返回 Level、ApiSuccess 包装等
       ▲
  tables/          Row 读写，映射为 objects
```

依赖应**单向**：`routes → body, api`；`api → body, validation, support, objects, tables`；`body → objects`；`validation → body, objects`；`support → tables, objects`。避免 `body` 或 `objects` 引用 `api`。

## 包名与子路径对照

`body/`、`validation/`、`support/` 的子路径与对应 `api/` 子路径**语义对齐**（不必逐字相同）：

| api 子路径 | body | validation | support（示例） |
| --- | --- | --- | --- |
| `level/api/design/` | `level/body/design/` | `level/validation/design/` | `level/support/design/` |
| `level/api/player/action/` | `level/body/player/` | — | `level/support/player/` |
| `admin/api/shop/` | `admin/body/shop/` | `admin/validation/shop/` | `admin/support/shop/` |
| `ui/api/pages/` | `ui/body/pages/` | — | `ui/support/pages/` |
| `bird/api/design/` | `bird/body/design/` | `bird/validation/design/` | `bird/support/design/` |

玩家关卡写操作：body 在 `level/body/player/`（与 api 的 `player/action` 对应）；前端 body 仍在 `api/level/player/action/body/`（见前端 ARCHITECTURE）。

## 完整示例：`CreateLevel`

| 文件 | 路径 |
| --- | --- |
| 路由 | `level/routes/DesignerLevelRouter.scala` — `POST /designer/levels`，`req.as[CreateLevelBody]` |
| 请求体 | `level/body/design/CreateLevelBody.scala` |
| 校验 | `level/validation/design/CreateLevelValidation.scala` |
| APIMessage | `level/api/design/CreateLevelApi.scala` |
| 领域类型 | `level/objects/level/Level.scala` |
| 表 | `level/tables/level/LevelTable.scala` |

`CreateLevelApi.scala` 典型 import：

```scala
import microservice.level.body.design.CreateLevelBody
import microservice.level.validation.design.CreateLevelValidation
import microservice.level.objects.core.Level
import microservice.level.tables.level.LevelTable
```

## 模块实例：`level/`

```text
level/
├── api/
│   ├── design/
│   │   ├── CreateLevelApi.scala
│   │   └── SubmitLevelApi.scala
│   └── player/
│       ├── read/          # GetPublishedLevelsApi 等
│       └── action/        # RateLevelApi、CreateCommentApi 等
├── body/
│   ├── design/            # CreateLevelBody, SubmitLevelBody
│   └── player/            # RateLevelBody, CreateCommentBody
├── validation/
│   └── design/            # CreateLevelValidation
├── objects/               # level/, terrain/, submission/, social/, …
├── support/
│   ├── design/            # LevelDesignAccess
│   └── player/            # LevelApiSupport
├── routes/
└── tables/
```

## 模块实例：`admin/`

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
│   ├── shop/
│   ├── submissions/
│   └── director/
│       ├── permissions/
│       ├── level_assignment/
│       └── bird_skill/
├── validation/
│   └── shop/              # AdminShopItemValidation
├── objects/
├── support/
│   ├── comments/
│   ├── shop/
│   ├── submission/
│   └── director/
├── routes/
└── tables/
```

## 与前端目录的对应

- **`*Api.scala` ↔ `*Api.ts`**：去掉后端路径中的 `/api/` 段，例如 `level/api/design/CreateLevelApi.scala` → `frontend/src/api/level/design/CreateLevelApi.ts`。
- **`*Body.scala` ↔ `*Body.ts`**：后端在 `<module>/body/<area>/`；前端在 `api/<module>/<area>/body/`（`body` 紧挨 `*Api.ts`）。例外：`level/body/player/` → `api/level/player/action/body/`。
- 领域类型：后端 `*/objects/` ↔ 前端 `frontend/src/objects/`。

校验脚本：`frontend/src/api/api-alignment.test.ts`（`npm test`）。

## 模块间调用（`api/internal/`）

其他业务模块**不得**直接 `import` 对方的 `tables` / `support` / `objects` 伴生方法；应调用提供方模块的 **internal API**，并在同一 `Connection` 上用 `PlanSteps.runApi`：

```scala
import microservice.level.api.internal.admin.ListPendingSubmissionsWithLevelInternalAPIMessage

// admin HTTP API 的 plan 内：
submissions <- PlanSteps.runApi(ListPendingSubmissionsWithLevelInternalAPIMessage(), connection)
```

| 约定 | 说明 |
| --- | --- |
| 路径 | `<module>/api/internal/<调用方>/XxxInternalApi.scala` |
| 挂载 | **不**挂 HTTP 路由，仅供进程内 `runApi` |
| 鉴权 | 由调用方 HTTP API 完成；internal API 不再校验角色 |
| 前端 | `api-alignment.test.ts` 跳过 `/api/internal/` |

跨模块 HTTP JSON 若需嵌套 level 类型，使用 `level.objects.codec.LevelCrossModuleCodecs` 导出 Circe 实例。

模块间 **handoff DTO**（如 `level/objects/user/ProfileLevelSnapshot`）由提供方定义；消费方在 `support/*Mapping` 中映射为自有 `objects/`，避免在 `objects/` 直接 `import` 他模块领域类型。

### 已落地的 internal API（按提供方）

| 提供方 | 路径 | 调用方 | 用途 |
| --- | --- | --- | --- |
| level | `api/internal/admin/` | admin | 投稿联查、评论、槽位分配、投稿审核 |
| level | `api/internal/user/` | user | 用户资料页 level 侧读聚合 |
| player | `api/internal/admin/` | admin | 商店 CRUD |
| player | `api/internal/ui/` | ui | 签到面板奖励注册 |
| bird | `api/internal/admin/` | admin | 总监 bird pool 选项 |
| bird | `api/internal/director/` | admin | 总监鸟类技能配置 |
| bird | `api/internal/player/` | player | 系统/已发布鸟类 catalog、技能配置映射 |
| admin | `api/internal/` | bird, admin | 审核审计写入 |

示例：

```scala
levelData <- PlanSteps.runApi(GetUserLevelProfileDataInternalAPIMessage(profileUserId), connection)
```

## 新增 API 检查清单

1. 若有 POST/PUT JSON 体：在 `<module>/body/<子域>/XxxBody.scala` 定义 DTO + `EntityDecoder`。
2. 若有可单测的字段规则：在 `<module>/validation/<子域>/` 增加 `validate*` / `check*`。
3. 在 `<module>/api/<子域>/XxxApi.scala` 只写 `XxxAPIMessage` 与 `plan`。
4. 查表/状态机抽到 `<module>/support/`（若多处复用）。
5. 响应/实体类型放 `<module>/objects/`；新表放 `<module>/tables/`。
6. 在 `<module>/routes/` 挂载 HTTP，只解析并 `runAuthenticated`。
7. 前端：同布局增加 `*Api.ts` 与 `body/*Body.ts`（若适用）。
