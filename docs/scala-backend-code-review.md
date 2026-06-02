# Scala Backend Code Review Guide

## 1. Review Goal

本次 code review 的目标，是将项目后端从原来的混合结构整理为更符合课程要求的 Scala 后端结构，并围绕以下三个重点进行展示：

- 后端结构如何对齐老师提供的 `backend-sample`
- API 契约如何体现类型安全和函数式风格
- 前端调用、后端接口、业务对象之间如何做到清晰对齐

这次改造的重点不是新增 UI，也不是凭空扩展业务范围，而是在保留现有真实业务语义的前提下，把后端重组为更适合课堂展示、也更容易在 code review 中解释的 Scala 项目结构。

## 2. Backend Structure Alignment

当前 Scala 后端已经整理为以 `src/main/scala/microservice` 为核心入口的标准 Scala 结构，并把真实 API、objects、routes、tables、core 代码全部落到课程要求的 `scala/microservice` 目录下。

### 2.1 当前 Scala 后端结构

- `src/main/scala/microservice/Main.scala`
- `src/main/scala/microservice/core/DatabaseConfig.scala`
- `src/main/scala/microservice/core/DatabaseSession.scala`
- `src/main/scala/microservice/core/HttpError.scala`
- `src/main/scala/microservice/core/SystemDefaults.scala`
- `src/main/scala/microservice/routes/ApiRouter.scala`
- `src/main/scala/microservice/routes/HealthRouter.scala`
- `src/main/scala/microservice/auth`
- `src/main/scala/microservice/user`
- `src/main/scala/microservice/level`
- `src/main/scala/microservice/admin`
- `src/main/scala/microservice/system`

### 2.2 与老师模板的对应关系

| 老师模板结构 | 当前项目结构 | 对齐说明 |
| --- | --- | --- |
| `Main.scala` | `src/main/scala/microservice/Main.scala` | 统一的 Scala 后端启动入口 |
| `DatabaseConfig.scala` | `src/main/scala/microservice/core/DatabaseConfig.scala` | 数据库配置对象 |
| `DatabaseSession.scala` | `src/main/scala/microservice/core/DatabaseSession.scala` | 数据库 session 抽象 |
| `HttpError.scala` | `src/main/scala/microservice/core/HttpError.scala` | 统一 HTTP 错误建模 |
| `SystemDefaults.scala` | `src/main/scala/microservice/core/SystemDefaults.scala` | 默认数据、service 组装、系统初始化 |
| `routes/ApiRouter.scala` | `src/main/scala/microservice/routes/ApiRouter.scala` | 统一挂载模块路由 |
| `routes/HealthRouter.scala` | `src/main/scala/microservice/routes/HealthRouter.scala` | 健康检查路由 |
| 示例业务模块 | `src/main/scala/microservice/level` | 结合当前项目真实业务，使用 `level` 承载关卡业务 |
| 示例用户模块 | `src/main/scala/microservice/user` | 用户资料模块 |
| 示例系统模块 | `src/main/scala/microservice/system` | 系统通用对象与健康检查 |
| 样例未直接提供 `auth` | `src/main/scala/microservice/auth` | 当前项目存在真实认证绑定需求 |
| 样例未直接提供 `admin` | `src/main/scala/microservice/admin` | 当前项目存在管理员审核业务 |

### 2.3 结构调整的核心说明

原项目中存在两套后端相关代码：

- `src/backend` 下的 TypeScript + Express 后端
- `src/main/scala` 下早期未完全对齐课程要求的 Scala 草稿结构

本次调整后的重点是：

- 将 Scala 后端重组到 `src/main/scala/microservice`
- 删除不再符合目标结构的旧 `services`、`routes` 和空草稿目录
- 保留现有 TypeScript 后端作为业务逻辑对照和后续迁移参考

因此，当前课程要求中的 `scala/microservice` 已经具体落地为：

- Scala 微服务入口：`src/main/scala/microservice/Main.scala`
- API 定义：`src/main/scala/microservice/<module>/api`
- routes 定义：`src/main/scala/microservice/<module>/routes`
- 公共类型与默认组装：`src/main/scala/microservice/core`

## 3. Service Module Layers

当前各业务模块统一采用 `src/main/scala/microservice/<module>/{api,objects,routes,tables}` 的四层结构。这样拆分的目的，是让 API 契约、业务对象、HTTP 路由和数据层模型各自承担单一职责，避免代码全部堆在同一个文件中。

### 3.1 四层结构职责

| 分层 | 位置示例 | 主要职责 |
| --- | --- | --- |
| `api` | `src/main/scala/microservice/level/api/CreateLevelApi.scala` | 定义 API 契约，包括 request、response、error、service trait、endpoint 说明 |
| `objects` | `src/main/scala/microservice/level/objects/LevelObjects.scala` | 定义领域对象，例如 `Level`、`LevelData`、`Rating`、`Submission` |
| `routes` | `src/main/scala/microservice/level/routes/DesignerLevelRouter.scala` | 定义 HTTP 入口、解析 header/path/body、调用 service、返回响应 |
| `tables` | `src/main/scala/microservice/level/tables/LevelTables.scala` | 定义数据层模型，例如 `LevelRow`、`RatingRow`、`SubmissionRow` |

### 3.2 为什么这样分层

这种分层使每个 API 都可以从四个视角清楚解释：

- `api` 负责回答“接口收什么、回什么、如何失败”
- `objects` 负责回答“业务领域里有哪些核心对象”
- `routes` 负责回答“HTTP 请求如何进入系统”
- `tables` 负责回答“数据在存储层如何表达”

### 3.3 route 和 service 的边界

在这套结构中，route 不直接堆业务逻辑。route 主要做三件事：

- 读取请求头、路径参数、请求体
- 调用对应的 service
- 将 `Either[HttpError, Response]` 转换为 HTTP 响应

业务规则应当由 service 负责，例如：

- 设计师创建关卡时必须由当前登录身份决定 `designerId`
- 玩家只能给已发布关卡评分
- 管理员只能审核 `pending_review` 状态的 submission

这样拆分之后，课堂讲解时可以非常清楚地区分：

- 路由层在处理 HTTP
- service 层在处理业务规则

## 4. Frontend and Backend API Alignment

当前项目前端的 API 调用主要集中在 `src/frontend/lib/api`。Scala 后端则按照这些真实存在的调用路径，在 `src/main/scala/microservice/<module>/api` 和 `src/main/scala/microservice/<module>/routes` 中建立对应关系。

### 4.1 对齐关系总表

| Frontend API file | Scala API file | Scala router file | HTTP method | Path | Business purpose |
| --- | --- | --- | --- | --- | --- |
| `src/frontend/lib/api/auth-api.ts` | `src/main/scala/microservice/auth/api/AuthApi.scala` | `src/main/scala/microservice/auth/routes/AuthRouter.scala` | `POST` | `/auth/bind` | 绑定前端本地身份与后端用户 |
| `src/frontend/lib/api/user-api.ts` | `src/main/scala/microservice/user/api/GetUserProfileApi.scala` | `src/main/scala/microservice/user/routes/UserRouter.scala` | `GET` | `/users/:userId/profile` | 查询用户资料页所需的公开信息 |
| `src/frontend/lib/api/designer-api.ts` | `src/main/scala/microservice/level/api/CreateLevelApi.scala` | `src/main/scala/microservice/level/routes/DesignerLevelRouter.scala` | `POST` | `/designer/levels` | 设计师创建关卡 |
| `src/frontend/lib/api/player-api.ts` | `src/main/scala/microservice/level/api/RateLevelApi.scala` | `src/main/scala/microservice/level/routes/PlayerLevelRouter.scala` | `POST` | `/player/levels/:levelId/ratings` | 玩家对已发布关卡评分 |
| `src/frontend/lib/api/admin-api.ts` | `src/main/scala/microservice/admin/api/ReviewSubmissionApi.scala` | `src/main/scala/microservice/admin/routes/AdminRouter.scala` | `POST` | `/admin/submissions/:submissionId/review` | 管理员审核投稿并推进状态流转 |

### 4.2 对齐原则

这次对齐采用的原则是：

- 保持前端已有的真实调用路径不变
- 在 Scala 后端中为这些真实路径定义强类型 request / response
- 通过 `objects` 使前端 schema 和 Scala 领域对象能够一一对应

这样做的好处是，课堂上可以直接从前端调用文件追到后端 API 定义，再追到路由和业务逻辑，链路非常清晰。

## 5. Core APIs for Presentation

下面整理了 5 个最适合课堂展示的核心 API。它们覆盖了认证、用户资料、设计师建关卡、玩家评分、管理员审核五类典型业务。

### 5.1 POST /auth/bind

- Frontend file:
  `src/frontend/lib/api/auth-api.ts`
- Scala API file:
  `src/main/scala/microservice/auth/api/AuthApi.scala`
- Scala route file:
  `src/main/scala/microservice/auth/routes/AuthRouter.scala`
- Request type:
  `BindBackendUserRequest`
- Response type:
  `BindBackendUserResponse`
- Service trait:
  `AuthService`
- Business logic:
  使用 `localUserId + role` 生成稳定绑定标识；如果已有绑定则复用旧用户，否则创建新的后端用户。
- Review explanation:
  这个 API 体现了“前端本地身份”和“后端正式用户”之间的映射关系，避免同一个本地身份重复创建多个后端用户。

### 5.2 GET /users/:userId/profile

- Frontend file:
  `src/frontend/lib/api/user-api.ts`
- Scala API file:
  `src/main/scala/microservice/user/api/GetUserProfileApi.scala`
- Scala route file:
  `src/main/scala/microservice/user/routes/UserRouter.scala`
- Request type:
  `GetUserProfileRequest`
- Response type:
  `GetUserProfileResponse`
- Service trait:
  `UserService`
- Business logic:
  返回资料页需要的公开信息，包括用户信息、已发布关卡、最近评论和统计数据，而不是把所有后台字段都暴露出去。
- Review explanation:
  这个 API 适合展示“聚合式响应”，说明后端不只是查单表，而是根据页面用途组织响应结构。

### 5.3 POST /designer/levels

- Frontend file:
  `src/frontend/lib/api/designer-api.ts`
- Scala API file:
  `src/main/scala/microservice/level/api/CreateLevelApi.scala`
- Scala route file:
  `src/main/scala/microservice/level/routes/DesignerLevelRouter.scala`
- Request type:
  `CreateLevelRequest`
- Response type:
  `CreateLevelResponse`
- Service trait:
  `DesignerLevelService`
- Business logic:
  从当前请求上下文读取 `designerId`，创建新的关卡对象，并将状态初始化为 `draft`。
- Review explanation:
  这个 API 说明后端不会直接信任前端传入的作者身份，而是由后端上下文决定真正的创建者。

### 5.4 POST /player/levels/:levelId/ratings

- Frontend file:
  `src/frontend/lib/api/player-api.ts`
- Scala API file:
  `src/main/scala/microservice/level/api/RateLevelApi.scala`
- Scala route file:
  `src/main/scala/microservice/level/routes/PlayerLevelRouter.scala`
- Request type:
  `RateLevelRequest`
- Response type:
  `RateLevelResponse`
- Service trait:
  `PlayerRatingService`
- Business logic:
  玩家只能给已发布关卡评分；同一玩家对同一关卡重复评分时，更新旧记录而不是新增；评分完成后重算平均分和评分人数。
- Review explanation:
  这个 API 很适合展示业务约束和状态校验，因为它同时包含权限前提、重复评分处理和聚合数据更新。

### 5.5 POST /admin/submissions/:submissionId/review

- Frontend file:
  `src/frontend/lib/api/admin-api.ts`
- Scala API file:
  `src/main/scala/microservice/admin/api/ReviewSubmissionApi.scala`
- Scala route file:
  `src/main/scala/microservice/admin/routes/AdminRouter.scala`
- Request type:
  `ReviewSubmissionRequest`
- Response type:
  `ReviewSubmissionResponse`
- Service trait:
  `AdminReviewService`
- Business logic:
  只有 `pending_review` 的 submission 才允许审核；审核通过时发布关卡，审核拒绝时将关卡设为 `rejected`。
- Review explanation:
  这个 API 适合展示后台状态流转，能够清楚说明 submission 状态和 level 状态如何联动推进。

## 6. Functional and Type-Safe API Design

当前项目的 Scala 后端主要通过以下方式体现函数式和类型安全设计。

### 6.1 request / response 使用 `case class`

例如：

- `src/main/scala/microservice/auth/api/AuthApi.scala` 中的 `BindBackendUserRequest` / `BindBackendUserResponse`
- `src/main/scala/microservice/user/api/GetUserProfileApi.scala` 中的 `GetUserProfileRequest` / `GetUserProfileResponse`
- `src/main/scala/microservice/level/api/CreateLevelApi.scala` 中的 `CreateLevelRequest` / `CreateLevelResponse`
- `src/main/scala/microservice/level/api/RateLevelApi.scala` 中的 `RateLevelRequest` / `RateLevelResponse`
- `src/main/scala/microservice/admin/api/ReviewSubmissionApi.scala` 中的 `ReviewSubmissionRequest` / `ReviewSubmissionResponse`

这意味着每个接口的输入输出都是显式类型，而不是零散地依赖未受约束的 JSON 字段。

### 6.2 error 使用 `sealed trait` 或 `HttpError`

例如：

- `src/main/scala/microservice/auth/api/AuthApi.scala` 中定义了 `AuthError`
- `src/main/scala/microservice/user/api/GetUserProfileApi.scala` 中定义了 `UserApiError`
- `src/main/scala/microservice/level/api/CreateLevelApi.scala` 中定义了 `DesignerLevelApiError`
- `src/main/scala/microservice/level/api/RateLevelApi.scala` 中定义了 `PlayerRatingApiError`
- `src/main/scala/microservice/admin/api/ReviewSubmissionApi.scala` 中定义了 `AdminReviewApiError`
- `src/main/scala/microservice/core/HttpError.scala` 提供统一的 HTTP 错误表达

这样做可以把错误建模成明确的类型，而不是依赖到处散落的字符串判断。

### 6.3 service trait 返回 `Either[HttpError, Response]`

例如：

- `AuthService`
- `UserService`
- `DesignerLevelService`
- `PlayerRatingService`
- `AdminReviewService`

这些 service trait 都采用 `Either[HttpError, Response]` 风格，显式表达：

- `Right(...)` 表示成功结果
- `Left(...)` 表示失败结果

这是一种典型的函数式表达方式，强调把成功和失败都作为值来处理。

### 6.4 状态和角色被类型化

在 `src/main/scala/microservice/system/objects/SystemObjects.scala` 中，当前项目将关键状态抽象为类型：

- `UserRole`
- `LevelStatus`
- `SubmissionStatus`
- `LevelTag`

这样做可以避免在代码中反复散落裸字符串，也降低非法状态值进入系统的概率。

### 6.5 route 和 service 分离

例如：

- `AuthRouter.scala`
- `UserRouter.scala`
- `DesignerLevelRouter.scala`
- `PlayerLevelRouter.scala`
- `AdminRouter.scala`

这些 route 文件只负责：

- 解析 header / path / body
- 调用 service
- 返回 HTTP 响应

业务规则不直接堆在 route 中，而是在 service 中表达。这样不仅结构更清楚，也更适合课堂解释每个 API 的职责边界。

### 6.6 API 契约和业务实现分离

当前项目中：

- `api` 层定义契约和 trait
- `SystemDefaults.scala` 提供当前可展示的默认 service 实现

这种设计使“接口长什么样”和“目前如何实现”是分开的，便于后续替换底层实现，例如从 in-memory 逻辑逐步替换为真实数据库实现。

## 7. Possible Questions and Answers

### 7.1 为什么还保留 TypeScript 后端，没有完全删掉？

推荐回答：

当前项目原来可运行的业务逻辑主要还在 `src/backend` 中。这次改造的重点是先把课程要求最关键的 Scala 结构、类型安全 API 契约和前后端对齐关系建立起来，而不是一次性重写全部运行时。保留 TypeScript 后端可以保证原有业务语义不丢失，也方便后续按模块继续迁移。

### 7.2 为什么模块是 `auth`、`user`、`level`、`admin`？

推荐回答：

模块命名是根据当前项目真实业务边界确定的，而不是套用与项目无关的示例名称。当前项目本身就包含认证绑定、用户资料、关卡创建与评分、管理员审核等业务，因此 Scala 后端也按这些真实边界组织模块。

### 7.3 为什么 `designer` 和 `player` 没有拆成两个独立 services？

推荐回答：

因为设计师创建关卡和玩家评分，核心都围绕 `level` 这个领域对象展开。为了避免重复定义关卡相关对象，这里把共享领域对象集中在 `src/main/scala/microservice/level/objects` 中，再通过不同的 API 和 route 区分设计师视角和玩家视角。

### 7.4 类型安全具体体现在哪里？

推荐回答：

主要体现在六个方面：

- request / response 使用 `case class`
- 错误使用 `sealed trait` 或 `HttpError`
- service trait 返回 `Either[HttpError, Response]`
- `UserRole`、`LevelStatus`、`SubmissionStatus`、`LevelTag` 等状态被类型化
- route 和 service 分离
- API 契约与业务实现分离

这些设计都可以直接在 `api`、`objects`、`HttpError.scala` 和 `SystemObjects.scala` 中看到。

### 7.5 为什么 route 里会读 header，比如 `x-user-id`？

推荐回答：

这是为了模拟认证上下文，体现后端不会直接信任 body 中提交的身份字段。例如创建关卡时，后端不是让前端随便提交 `authorId`，而是从当前请求上下文中读取用户身份，再决定真正的创建者。

### 7.6 为什么要单独有 `objects` 和 `tables`？

推荐回答：

`objects` 表达的是领域对象，是 API 和 service 主要操作的数据结构；`tables` 表达的是更靠近数据层的模型，例如 `LevelRow`、`RatingRow`。虽然当前实现还是轻量的 in-memory 风格，但提前分层后，后续接入真实数据库时不需要重新推翻 API 契约。

### 7.7 为什么只迁移 5 个 API？

推荐回答：

这次优先选择了最适合课堂展示的 5 个核心 API，它们覆盖了认证、用户资料、设计师建关卡、玩家评分、管理员审核五类典型场景。这样可以在有限时间内完整展示结构设计和业务规则，剩余 API 则保留为后续迁移任务。

### 7.8 哪些 API 还没迁移？

推荐回答：

尚未迁移到 Scala 的真实 API 主要包括：

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

这些 API 目前仍保留在 TypeScript 后端中，后续可以按相同模式继续迁移。

### 7.9 为什么说这是贴近老师模板，而不是完全照搬？

推荐回答：

因为当前项目保留了自身真实业务边界，并没有生硬照搬 `books` 等与本项目无关的模块名；但在结构层面，已经严格对齐了老师模板最核心的设计原则：Scala 标准源码目录、统一入口、统一 router、模块化 `microservice` 业务目录，以及模块内 `api/objects/routes/tables` 的分层方式。

## 8. Recommended Presentation Order

明天 code review 建议按以下顺序展示：

1. 先展示 `src/main/scala/microservice` 的目录结构
2. 展示 `src/main/scala/microservice/routes/ApiRouter.scala`
3. 展示 `src/main/scala/microservice/level` 的 `api/objects/routes/tables`
4. 展示 3 到 5 个核心 API
5. 展示前后端 API 对齐表
6. 最后讲函数式 / 类型安全设计

这个顺序的优点是：

- 先让老师看到结构已经对齐
- 再展示模块内部如何分层
- 然后进入 API 细节
- 最后再上升到设计思想总结

## 9. Final Summary

这次改造的重点不是 UI，也不是凭空扩展业务，而是把现有项目整理为符合课程要求的 Scala 后端结构，使 API 契约、类型安全、业务逻辑边界，以及前后端对齐关系都能够在 code review 中被清楚地展示和解释。通过 `src/main/scala/microservice/Main.scala`、`src/main/scala/microservice/routes/ApiRouter.scala`、模块化 `microservice` 目录，以及 5 个核心 API 的 request/response/service 设计，当前项目已经具备了较完整的课堂展示基础。
