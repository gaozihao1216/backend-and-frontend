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
│   └── http/            # HttpError、统一错误响应
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
| `objects/` | 领域对象（case class + Circe codec） |
| `routes/` | HTTP 解析（path/header/body），构造 APIMessage 并 `run` |
| `tables/` | 数据访问；inmemory 与 jdbc 双实现 |
| `utils/` 或 `runtime/` | 模块内辅助服务 |

## APIMessage 模式

所有 API 遵循统一执行协议：

```scala
final case class CreateLevelAPIMessage(
  designerId: String,
  body: CreateLevelBody
) extends APIWithTokenMessage[Level] {
  override def token: String = designerId

  override def plan(connection: Connection): IO[Either[HttpError, Level]] =
    for {
      _ <- AccessControl.requireRole(connection, designerId, UserRole.Designer)
      level <- LevelTable.insert(connection, ...)
    } yield Right(level)
}
```

原则：

- Route 只做 HTTP 解析，不写业务规则
- `plan(connection)` 内完成权限、校验、table 调用
- 返回 `IO[Either[HttpError, A]]`，由 `HttpError.fromEither` 转为 HTTP 响应
- 成功体包装为 `ApiSuccess(data)`，失败为 `ApiFailure(error)`

## 路由挂载

`ApiRouter.scala` 将模块路由组合如下：

| 前缀 | 模块 |
| --- | --- |
| `/health` | system |
| `/auth` | user（身份绑定，URL 兼容保留） |
| `/users` | user（资料聚合） |
| `/designer` | level（设计师）+ bird |
| `/player` | level（玩家读/写）+ player（ui/social/preparation） |
| `/admin/director/ui` | ui 定制 |
| `/admin` | admin（审核、评论、总监配置） |

认证上下文通过请求头 **`x-user-id`** 传递；后端不信任 body 中的用户身份字段。

## 权限模型

- `AccessControl.requireRole(connection, userId, role)`：校验 player / designer / admin
- `AccessControl.requireAdminLevel(connection, userId, AdminLevel.Standard | Director)`：管理员分级
  - **Standard**：关卡审核、评论管理、鸟类审核
  - **Director**：UI 定制、关卡槽位分配、鸟类技能配置等

`AdminLevel` 定义在 `system/objects/AdminLevel.scala`，用户表字段 `admin_level` 仅对 `role = admin` 有效。

## 存储层

### 默认：In-Memory

- 启动时使用 `DatabaseSession.inMemory`
- 种子数据由 `SystemSeedData` 注入（演示关卡、用户、模板等）
- 适合本地开发与课程演示，重启后 in-memory 状态重置（除非改 seed）

### 可选：PostgreSQL/JDBC

```bash
docker compose up -d postgres
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

### admin

普通管理员（Standard）：

- 待审核关卡/鸟类、审核操作、评论列表与删除

总监（Director）：

- 关卡槽位分配、鸟类技能板、权限转移等（`/admin/director/*` 部分路径）

### ui

总监专用，挂载在 `/admin/director/ui`：

- UI 页面 CRUD（`PageConfig`）
- 页面组件、按钮模板、拉伸视觉模板
- 共享关卡地图页配置

### bird

设计师创建/编辑/提交鸟类设计；管理员审核鸟类投稿。

### player

挂载在 `/player` 下若干子路径：

- **ui runtime**：动态 UI 数据、商店、签到、关卡进度
- **social**：社交相关数据
- **preparation**：备战、鸟池配置

实现以 `player/runtime/` 服务 + `player/tables/` 为主，部分 API 定义在 route 邻近层而非独立 `api/` 文件。

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
npm run dev:backend       # sbt run
npm run dev:backend:watch # sbt ~run
sbt compile
sbt test                  # 若有 Scala 测试
```
