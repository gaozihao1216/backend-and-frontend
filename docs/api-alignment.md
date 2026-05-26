# Scala Microservice API Alignment

## 为什么使用 `src/main/scala/microservice`

课程要求里强调：

- 后端必须使用 Scala
- API 必须定义在 `scala/microservice`
- 要展示函数式 / 类型安全 API 框架

在 sbt 项目里，真正会参与 `sbt compile` 的标准源码目录是：

- `src/main/scala`

因此本项目把可编译的 Scala API 定义层放在：

- `src/main/scala/microservice`

同时保留：

- `scala/microservice/README.md`

这样既满足 sbt 的标准编译目录，又能在课程检查时明确说明“字面上的 `scala/microservice` 在哪里，真正源码又在哪里”。

## 目录说明

当前 Scala API 定义层分成以下几个部分：

- `src/main/scala/microservice/core`
  - 轻量类型安全 API 框架
- `src/main/scala/microservice/auth`
  - 认证相关 API 契约
- `src/main/scala/microservice/user`
  - 用户资料相关 API 契约
- `src/main/scala/microservice/level`
  - 设计师建关卡、玩家评分相关 API 契约
- `src/main/scala/microservice/admin`
  - 管理员审核相关 API 契约
- `src/main/scala/microservice/MicroserviceApiCatalog.scala`
  - 汇总所有已定义的核心 API，方便 code review 展示

## 核心类型安全框架

Scala 端使用的轻量 API 定义框架在：

- [src/main/scala/microservice/core/HttpMethod.scala](/mnt/z/Code/backend-and-frontend/src/main/scala/microservice/core/HttpMethod.scala:1)
- [src/main/scala/microservice/core/ApiContract.scala](/mnt/z/Code/backend-and-frontend/src/main/scala/microservice/core/ApiContract.scala:1)

它体现类型安全的方式如下：

- `sealed trait HttpMethod`
  - 用 Scala 类型系统限制 HTTP 方法集合
- `case class ApiPath(value: String)`
  - path 不是裸字符串常量拼接，而是显式契约对象
- `sealed trait ApiError`
  - 错误使用代数数据类型表达
- `trait ApiEndpoint[Req, Res]`
  - 每个 endpoint 都明确 request 类型和 response 类型
- `trait ApiHandler[Req, Res]`
  - handler 返回 `Either[ApiError, Res]`，用函数式方式表达成功 / 失败

这里没有引入额外复杂框架，主要依赖 Scala 标准类型、`case class`、`sealed trait`、`trait`、`Either`。

## 与前端和现有 TypeScript 后端的对应关系

前端 API 调用位置：

- `src/frontend/lib/api/auth-api.ts`
- `src/frontend/lib/api/user-api.ts`
- `src/frontend/lib/api/designer-api.ts`
- `src/frontend/lib/api/player-api.ts`
- `src/frontend/lib/api/admin-api.ts`

现有 TypeScript 路由位置：

- `src/backend/routes/auth-routes.ts`
- `src/backend/routes/user-routes.ts`
- `src/backend/routes/designer-routes.ts`
- `src/backend/routes/player-routes.ts`
- `src/backend/routes/admin-routes.ts`

现有 TypeScript 业务逻辑位置：

- `src/backend/services/auth-service.ts`
- `src/backend/services/user-service.ts`
- `src/backend/services/level-service.ts`
- `src/backend/services/rating-service.ts`
- `src/backend/services/submission-service.ts`

Scala 层的定位不是立刻替换整个 Node/Express 运行时，而是：

1. 把核心 API 契约显式定义为 Scala 类型
2. 把 request / response / error / service interface 抽离清楚
3. 让 code review 能清楚说明前后端契约和业务逻辑

## 当前已定义的 5 个核心 API

### 1. Auth: `POST /auth/bind`

- Scala 文件：`src/main/scala/microservice/auth/AuthApi.scala`
- 前端文件：`src/frontend/lib/api/auth-api.ts`
- TS 路由：`src/backend/routes/auth-routes.ts`
- TS service：`src/backend/services/auth-service.ts`

Scala 契约：

- `BindBackendUserRequest`
- `BindBackendUserResponse`
- `BindBackendUserEndpoint`
- `AuthService`

业务逻辑：

- 将前端 `localUserId + role` 绑定到后端用户
- 如果绑定可复用，则返回已有用户
- 否则创建一个新的后端用户

### 2. User: `GET /users/:userId/profile`

- Scala 文件：`src/main/scala/microservice/user/UserApi.scala`
- 前端文件：`src/frontend/lib/api/user-api.ts`
- TS 路由：`src/backend/routes/user-routes.ts`
- TS service：`src/backend/services/user-service.ts`

Scala 契约：

- `GetUserProfileRequest`
- `GetUserProfileResponse`
- `GetUserProfileEndpoint`
- `UserService`

业务逻辑：

- 查询指定用户
- 返回其公开资料
- 只带已发布关卡、最近评论和聚合统计

### 3. Designer: `POST /designer/levels`

- Scala 文件：`src/main/scala/microservice/level/DesignerLevelApi.scala`
- 前端文件：`src/frontend/lib/api/designer-api.ts`
- TS 路由：`src/backend/routes/designer-routes.ts`
- TS service：`src/backend/services/level-service.ts`

Scala 契约：

- `CreateLevelRequest`
- `CreateLevelResponse`
- `CreateLevelEndpoint`
- `DesignerLevelService`

业务逻辑：

- 当前 designer 创建一个新关卡
- 新关卡初始状态为 `draft`
- 初始评分统计为 0

### 4. Player: `POST /player/levels/:levelId/ratings`

- Scala 文件：`src/main/scala/microservice/level/PlayerRatingApi.scala`
- 前端文件：`src/frontend/lib/api/player-api.ts`
- TS 路由：`src/backend/routes/player-routes.ts`
- TS service：`src/backend/services/rating-service.ts`

Scala 契约：

- `RateLevelRequest`
- `RateLevelResponse`
- `RateLevelEndpoint`
- `PlayerRatingService`

业务逻辑：

- 玩家只能给已发布关卡评分
- 同一玩家对同一关卡只保留一条评分记录
- 评分后要刷新平均分和评分人数

### 5. Admin: `POST /admin/submissions/:submissionId/review`

- Scala 文件：`src/main/scala/microservice/admin/AdminReviewApi.scala`
- 前端文件：`src/frontend/lib/api/admin-api.ts`
- TS 路由：`src/backend/routes/admin-routes.ts`
- TS service：`src/backend/services/submission-service.ts`

Scala 契约：

- `ReviewSubmissionRequest`
- `ReviewSubmissionResponse`
- `ReviewSubmissionEndpoint`
- `AdminReviewService`

业务逻辑：

- 管理员审核一个待审核 submission
- 审核通过则发布关卡
- 审核拒绝则把关卡标记为 rejected

## 这些 Scala API 如何体现函数式 / 类型安全

可以在 code review 时直接指出：

1. request 和 response 都是 `case class`
2. error 是 `sealed trait` 及其子类型
3. endpoint 是 `ApiEndpoint[Req, Res]`
4. service trait 返回 `Either[ApiError, Response]`
5. API 契约与实际业务实现分离

这比把请求和响应都写成 `Map[String, Any]` 或散落字符串常量更容易维护，也更容易讲清楚每个 API 的业务边界。

## 明天 code review 建议重点展示

优先展示这些文件：

1. [src/main/scala/microservice/core/ApiContract.scala](/mnt/z/Code/backend-and-frontend/src/main/scala/microservice/core/ApiContract.scala:1)
2. [src/main/scala/microservice/auth/AuthApi.scala](/mnt/z/Code/backend-and-frontend/src/main/scala/microservice/auth/AuthApi.scala:1)
3. [src/main/scala/microservice/user/UserApi.scala](/mnt/z/Code/backend-and-frontend/src/main/scala/microservice/user/UserApi.scala:1)
4. [src/main/scala/microservice/level/DesignerLevelApi.scala](/mnt/z/Code/backend-and-frontend/src/main/scala/microservice/level/DesignerLevelApi.scala:1)
5. [src/main/scala/microservice/level/PlayerRatingApi.scala](/mnt/z/Code/backend-and-frontend/src/main/scala/microservice/level/PlayerRatingApi.scala:1)
6. [src/main/scala/microservice/admin/AdminReviewApi.scala](/mnt/z/Code/backend-and-frontend/src/main/scala/microservice/admin/AdminReviewApi.scala:1)
7. [src/main/scala/microservice/MicroserviceApiCatalog.scala](/mnt/z/Code/backend-and-frontend/src/main/scala/microservice/MicroserviceApiCatalog.scala:1)

展示顺序建议：

1. 先讲 `core` 里的类型安全框架
2. 再讲 5 个核心 API 的 request / response / error / service trait
3. 最后把 Scala 文件对应回前端 `src/frontend/lib/api` 和 TS `routes/services`

## 验证情况

本轮已验证：

- `npm run build` 通过，说明现有前端和 TypeScript 工程未被破坏

本轮未能在当前环境完成：

- `sbt compile`

原因是当前执行环境中没有安装 `sbt`，命令返回的是：

- `sbt: command not found`

因此源码已经按 sbt 标准目录准备好，但要实际执行 `sbt compile`，仍需要本机或评审环境提供 `sbt`。
