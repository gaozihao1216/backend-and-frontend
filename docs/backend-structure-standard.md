# 后端结构规范

本文档定义当前 Scala 后端的目录、命名、依赖方向与 API 编写规范。目标是让新增功能时有统一判断：文件放在哪里、类型怎么返回、跨模块怎么调用。

## 总体原则

- 后端运行时只维护 `backend/microservice/src/` 下的 Scala/http4s 单体服务。
- 业务入口统一写成 `XxxAPIMessage`，每个 API 都通过 `plan(connection): IO[Either[HttpError, A]]` 表达业务流程。
- 普通业务文件统一使用 `IO[Either[HttpError, A]]` 表达可预期失败，不再定义或暴露旧的流程包装类型。
- `objects/` 中既放领域对象，也放请求对象；不再单独建立请求体目录。
- `tables/` 中每个表按 `*Table.scala` + `*TableInitializer.scala` 成对维护。
- `support/` 只放多 API 复用能力；单个 API 专用逻辑优先保留在对应 `*Api.scala` 的私有方法中。

## 标准目录

```text
backend/microservice/src/
├── Main.scala
├── routes/                  # 全局 API 注册与 health 入口
├── infrastructure/          # APIMessage、数据库会话、HTTP 错误、认证中间件
├── system/                  # 枚举、系统对象、健康检查、启动初始化编排
├── user/                    # 用户身份、资料、权限校验
├── level/                   # 关卡设计、投稿、玩家读写
├── admin/                   # 审核、评论管理、总监能力
├── bird/                    # 鸟类设计、审核、技能配置
├── player/                  # 玩家商店、社交、备战、动态 UI 数据
└── ui/                      # UI 页面、组件、视觉模板配置
```

每个业务模块按需包含：

```text
<module>/
├── api/                     # 仅 *Api.scala，定义 XxxAPIMessage
├── objects/                 # 领域对象、请求对象、响应对象、错误对象
├── validation/              # 字段/结构校验
├── support/                 # 多 API 复用辅助能力
├── routes/                  # 模块 API 注册表
└── tables/                  # Row、Table、TableInitializer
```

## 各层职责

| 层 | 做什么 | 不做什么 |
| --- | --- | --- |
| `api/` | 定义 `XxxAPIMessage`；在 `plan` 中串联鉴权、校验、读写和组装返回值 | 不放请求对象；不新增请求体目录或 `support/` 子目录 |
| `objects/` | 定义 case class、枚举、请求对象、响应对象、错误对象、Circe codec | 不访问数据库；不写业务流程 |
| `validation/` | 校验字段、结构、枚举值范围，返回 `IO[Either[HttpError, A]]` | 不访问 `Connection`；不调用 Table |
| `support/` | 复用的 mapping、seed、bootstrap、catalog、defaults、动态分派等 | 不承接单个 API 独有逻辑 |
| `routes/` | 注册 APIMessage，适配统一 API 路由 | 不写业务规则；不直接调用 Table |
| `tables/` | 表初始化、Row 与持久化读写 | 不返回 HTTP 响应；不处理鉴权 |

## API 编写规范

每个 `*Api.scala` 文件只定义一个主要 `XxxAPIMessage`。文件名、类名和前端 API 文件保持同名。

```scala
final case class CreateLevelAPIMessage(
  designerId: String,
  body: CreateLevelRequest
) extends APIWithTokenMessage[Level] {
  override def token: String = designerId

  override def plan(connection: Connection): IO[Either[HttpError, Level]] =
    PlanSteps.finish {
      for {
        _ <- PlanSteps.fromEither(AccessControl.requireRole(connection, designerId, UserRole.Designer))
        validated <- PlanSteps.fromEither(CreateLevelValidation.validate(body))
        level <- PlanSteps.read(LevelTable.insert(connection, toRow(validated)))
      } yield LevelRowMapper.toLevel(level)
    }
}
```

规则：

- `plan` 的返回类型必须是 `IO[Either[HttpError, A]]`。
- `AccessControl`、`validation`、`support` 对外返回 `IO[Either[HttpError, A]]`，在 API 内用 `PlanSteps.fromEither(...)` 接入。
- 表读写统一放进 `PlanSteps.read { ... }` 或 `PlanSteps.blocking { ... }`。
- API 内部若需要短路组合，可直接使用标准 `EitherT[IO, HttpError, A]` 作为私有实现细节；不要再引入自定义流程类型别名。
- 单 API 专用的查表、状态判断、写结果校验，可以写成当前文件的 `private def requireXxx(...)`。

## 请求对象与领域对象

请求对象不单独放请求体目录，统一归到 `objects/<子域>/request/` 或对应对象子域中。

示例：

| API | 请求对象 | 返回对象 |
| --- | --- | --- |
| `level/api/design/CreateLevelApi.scala` | `level/objects/design/request/CreateLevelRequest.scala` | `level/objects/core/Level.scala` |
| `bird/api/design/UpdateBirdDesignApi.scala` | `bird/objects/design/request/UpdateBirdDesignRequest.scala` | `bird/objects/design/BirdDesign.scala` |
| `ui/api/pages/management/CreateUiPageApi.scala` | `ui/objects/page/request/CreateUiPageRequest.scala` | `ui/objects/page/PageConfig.scala` |

`objects/` 可以按业务对象分类，例如：

```text
objects/
├── core/
├── terrain/
├── submission/
├── social/
├── request/
└── errors/
```

分类依据是“对象语义”，不是 HTTP 层临时传输结构。

## Validation 规范

`validation/` 只处理纯字段和结构规则：

```scala
private[level] object CreateLevelValidation {
  def validate(body: CreateLevelRequest): IO[Either[HttpError, CreateLevelRequest]] =
    IO.pure(check(body))

  private def check(body: CreateLevelRequest): Either[HttpError, CreateLevelRequest] =
    ...
}
```

要求：

- 返回 `IO[Either[HttpError, A]]`。
- 可以保留私有 `check` 做纯 `Either` 判断。
- 不依赖 `Connection`。
- 不调用其他模块 API 或 Table。

## Support 规范

`support/` 只放可复用能力。判断标准：

- 两个以上 API 会用到。
- 跨模块 handoff mapping 需要集中管理。
- 启动初始化、seed、catalog、defaults 这类非单 API 流程。
- 动态 UI data/action 分派等天然共享逻辑。

返回规范：

```scala
def requireSomething(connection: Connection, id: String): IO[Either[HttpError, DomainObject]]
```

不建议放入 `support/` 的内容：

- 只服务一个 API 的查表方法。
- 为了“看起来分层”拆出的空壳 service。
- 命名模糊的 `runtime/`、`utils/` 大杂烩目录。

## 权限规范

权限统一由 `user/support/AccessControl.scala` 提供：

```scala
AccessControl.requireRole(connection, userId, UserRole.Player)
AccessControl.requireAdminLevel(connection, userId, AdminLevel.Director)
AccessControl.requireKnownUser(connection, userId)
AccessControl.requireBoundIdentity(headerUserId, token)
```

这些方法返回 `IO[Either[HttpError, UserRow | Unit]]`。API 内必须通过 `PlanSteps.fromEither(...)` 接入，不在 routes 中手写角色判断。

## Tables 规范

每个表目录保持清晰三类职责：

```text
tables/<table_name>/
├── XxxRow.scala              # 存储行结构
├── XxxTable.scala            # 查询、插入、更新、删除
└── XxxTableInitializer.scala # DDL 与启动初始化
```

要求：

- `Table` 方法接收 `Connection`。
- `Table` 不返回 `HttpError`。
- 业务错误由 API / support 根据 Table 结果转换。
- Row 到领域对象的映射放在 `Table` 或 `*RowMapper`，不要散落在 routes。

## Internal API 规范

跨模块调用必须通过 `api/internal/`，不要直接访问对方模块的 tables。

```scala
submission <- PlanSteps.runApi(
  GetSubmissionWithLevelInternalAPIMessage(submissionId),
  connection
)
```

规则：

- 路径：`<provider>/api/internal/<consumer>/XxxInternalApi.scala`
- 不挂 HTTP 路由。
- 调用方负责外部鉴权。
- internal API 仍然实现 `APIMessage[A]`，仍然返回 `IO[Either[HttpError, A]]`。

## 前后端对齐

后端 API 文件和前端 API 文件按模块、子目录、文件名对齐。

```text
backend/microservice/src/level/api/design/CreateLevelApi.scala
frontend/src/api/level/design/CreateLevelApi.ts
```

约定：

- 后端路径去掉 `src/<module>/api/` 后，与前端 `frontend/src/api/<module>/` 对齐。
- 后端请求对象在 `objects/`，前端请求 schema 放在对应 API 子目录的对象/schema 文件中。
- 新增后端 API 后，同步检查前端 API client、Vite proxy 和 API 对齐测试。

## 新增功能检查清单

1. 是否需要新 API？如果需要，在对应 `<module>/api/<子域>/XxxApi.scala` 新增。
2. 是否有请求体？放入 `<module>/objects/<子域>/request/`。
3. 是否有领域返回对象或错误对象？放入 `<module>/objects/<子域>/` 或 `errors/`。
4. 是否只是字段校验？放入 `validation/`，返回 `IO[Either]`。
5. 是否被多个 API 复用？才放入 `support/`。
6. 是否跨模块？通过提供方 `api/internal/` 调用。
7. 是否需要表？同时新增或更新 `*Row`、`*Table`、`*TableInitializer`。
8. `plan` 是否返回 `IO[Either[HttpError, A]]`。
9. 是否没有旧的流程包装类型。
10. 是否通过 `sbt compile`。
