# 业务模块目录布局

本文档说明 `backend/microservice/src/<module>/` 下各子目录的职责、包名约定，以及一次 HTTP 请求在各层之间的流转关系。与 `docs/backend-architecture.md` 互补：后者偏全局架构与路由；本文档偏**单模块内文件应放在哪里**。

## 标准目录树

每个业务模块（`user`、`level`、`admin`、`bird`、`ui`、`player` 等）在 `api/` 之外，按需包含下列目录：

```text
<module>/
├── api/              # 仅 *Api.scala：XxxAPIMessage + plan 编排
├── validation/       # 字段/请求校验 → PlanStep.Step
├── objects/          # 领域类型、请求对象、响应体、实体、错误码对象
├── support/          # 可复用辅助能力（mapping/seed/bootstrap/catalog/defaults 等）
├── routes/           # path/header/body 解析 → 构造 APIMessage
└── tables/           # *Row + Table + TableInitializer
```

另有模块专属目录（非全模块通用）：

| 目录 | 模块 | 说明 |
| --- | --- | --- |
| `support/bootstrap/` | 各业务模块 | `*StorageBootstrap`：DDL/表初始化，供 `system` 启动编排 |
| `support/preparation/` | player | 多 API 复用的备战目录/映射/组装能力 |
| `support/{shop,checkin,wallet,ui}/` | player | 动态 UI data/action 复用分派、默认值与商店/签到服务能力 |

`infrastructure/api/` 放框架级 `APIMessage`、`PlanStep`、`PlanSteps`，与业务 `*/api/*Api.scala` 不同。

## 各层职责

### `api/` — 仅 APIMessage

- **只放** `*Api.scala`（如 `CreateLevelApi.scala` 内定义 `CreateLevelAPIMessage`）。
- **禁止** 在业务 `api/` 下再放 `validation/`、`support/`、请求对象子目录或 `object` 伴生块（`api` 层只做流程编排）。
- `plan(connection)` 用 `PlanSteps.finish { for { ... } yield ... }` 串联步骤，步骤旁用 `// 步骤 N：` 注释。

### `validation/` — 纯校验

- `validate*(...): PlanStep.Step[A]` 供 `plan` 调用；同步 `check*(...): Either[HttpError, A]` 供单元测试。
- 只依赖 `objects`、错误码对象，不访问 `Connection`、不调用 Table。
- 包名：`microservice.<module>.validation.<子域>`。

### `objects/` — 领域模型与请求对象

- 纯数据 case class、枚举、错误码对象、请求对象；详见 [`OBJECTS.md`](./OBJECTS.md)。
- APIMessage 的入站请求类型、返回类型与 plan 内组装的 JSON/实体均来自此处（或 `system/objects`）。
- 请求对象可提供 Circe `Encoder`/`Decoder` + http4s `EntityDecoder`，但不写权限、查表或业务流程。

### `support/` — 可复用辅助能力

- 优先让业务流程留在对应 `*Api.scala` 的 `plan(connection)` 里。
- 只有多 API 复用、跨模块 handoff 映射、seed/bootstrap/catalog/defaults、动态 UI 分派等能力放入 `support/`。
- 单 API 专用的查表、状态判断、双写同步逻辑应作为该 API 文件内的私有方法，而不是新增 support 文件。
- 与 `validation/` 区别：support 可以读 `Connection` 或调 Table；validation 只做字段/结构校验。
- 示例：`ui/support/pages/UiPageAccess.scala`、`player/support/ui/PlayerUiRuntimeSupport.scala`、`*/support/mapping/*`。

### `routes/` — HTTP 适配

- 解析 path、query、`x-user-id`、JSON body。
- 构造 `XxxAPIMessage(...).runAuthenticated(userId, databaseSession)`。
- **不写**业务规则、**不**直接 `withTransaction` 或调 Table。

### `tables/` — 持久化

- `*Row` 对应存储列；`*Table.scala` 负责表读写，`*TableInitializer.scala` 负责 DDL/seed 初始化。
- Row ↔ objects 映射在 Table 或 `*RowMapper` 中，不在 `objects/` 内嵌 SQL。

## 请求流转（依赖方向）

```text
  HTTP 客户端
       │
       ▼
  routes/          req.as[CreateLevelRequest]  ──import──►  objects/
       │
       ▼
  api/*Api.scala   plan { AccessControl → validation → private plan helpers → PlanSteps.read(Table) }
       │                    │              │              │
       │                    ▼              ▼              ▼
       │              user/support  validation/     support/
       │              AccessControl
       ▼
  objects/         返回 Level、ApiSuccess 包装等
       ▲
  tables/          Row 读写，映射为 objects
```

依赖应**单向**：`routes → objects, api`；`api → objects, validation, support, tables`；`validation → objects`；`support → tables, objects`。避免 `objects` 引用 `api`。单 API 专用流程不要反向抽进 `support`。

## 包名与子路径对照

`objects/`、`validation/`、`support/` 的子路径与对应 `api/` 子路径**语义对齐**（不必逐字相同）。如果逻辑只服务单个 API，则留在 `api/*Api.scala` 的私有方法中：

| api 子路径 | 请求对象/领域对象 | validation | support（仅复用时） |
| --- | --- | --- | --- |
| `level/api/design/` | `level/objects/design/` | `level/validation/design/` | — |
| `level/api/player/action/` | `level/objects/player/request/` | — | `level/support/player/` |
| `admin/api/shop/` | `admin/objects/shop/` | `admin/validation/shop/` | — |
| `ui/api/pages/` | `ui/objects/pages/` | — | `ui/support/pages/` |
| `bird/api/design/` | `bird/objects/design/` | `bird/validation/design/` | `bird/support/design/` |

玩家关卡写操作：请求对象在 `level/objects/player/request/`（与 api 的 `player/action` 对应）；前端请求 schema 暂时仍在 `api/level/player/action/body/`（见前端 ARCHITECTURE）。

## 完整示例：`CreateLevel`

| 文件 | 路径 |
| --- | --- |
| 路由 | `level/routes/DesignerLevelRouter.scala` — `POST /designer/levels`，`req.as[CreateLevelRequest]` |
| 请求对象 | `level/objects/design/request/CreateLevelRequest.scala` |
| 校验 | `level/validation/design/CreateLevelValidation.scala` |
| APIMessage | `level/api/design/CreateLevelApi.scala` |
| 领域类型 | `level/objects/level/Level.scala` |
| 表 | `level/tables/level/LevelTable.scala` |

`CreateLevelApi.scala` 典型 import：

```scala
import microservice.level.objects.design.request.CreateLevelRequest
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
├── validation/
│   └── design/            # CreateLevelValidation
├── objects/               # core/, terrain/, submission/, social/, design/, player/, …
├── support/
│   └── seed/              # demo level 数据
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
- **`*Request.scala` ↔ `*Body.ts`**：后端请求对象在 `<module>/objects/<area>/request/`；前端请求 schema 暂时在 `api/<module>/<area>/body/`（`body` 紧挨 `*Api.ts`）。例外：`level/objects/player/request/` → `api/level/player/action/body/`。
- 领域类型：后端 `*/objects/` ↔ 前端 `frontend/src/objects/`。

校验脚本：`frontend/src/system/api/api-alignment.test.ts`（`npm test`）。

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

1. 若有 POST/PUT JSON 体：在 `<module>/objects/<子域>/request/XxxRequest.scala` 定义请求对象 + `EntityDecoder`。
2. 若有可单测的字段规则：在 `<module>/validation/<子域>/` 增加 `validate*` / `check*`。
3. 在 `<module>/api/<子域>/XxxApi.scala` 只写 `XxxAPIMessage` 与 `plan`。
4. 查表/状态机抽到 `<module>/support/`（若多处复用）。
5. 响应/实体类型放 `<module>/objects/`；新表放 `<module>/tables/`。
6. 在 `<module>/routes/` 挂载 HTTP，只解析并 `runAuthenticated`。
7. 前端：同布局增加 `*Api.ts` 与请求 schema（当前仍放在对应 API 目录的 `body/*Body.ts`）。
