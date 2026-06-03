# Project Architecture

这是一个 UGC level platform：设计师创建关卡，管理员审核提交，玩家游玩、评分、收藏和评论已发布关卡。

## Top-Level Structure

- `frontend`: React + Vite 前端。
- `frontend/dist`: 前端构建输出。
- `frontend/public`: 静态资源。
- `frontend/src`: 前端源码。
- `backend/microservice/src`: Scala/http4s 后端源码，一个大服务，按业务模块逻辑拆分。
- `backend/docker`: 后端 SQL seed/init 文件。
- `docs`: 架构和 API 对齐说明。

旧 `data`、`backend/src` 和 `backend/dist` 已移除。

## Frontend

`frontend/src` 的主要目录：

- `api`: 前端 API 调用，按 `system/auth/user/level/admin` 模块拆分。
- `objects`: 前端对象和 Zod schema，按后端模块拆分。
- `component`: UI 组件和页面内组件。
- `hook`: React hooks。
- `lib`: 游戏引擎、配置、纯逻辑函数。
- `page`: 页面入口。
- `store`: 前端状态。

`frontend/src/api/*-api.ts` 是兼容聚合入口；真正的一 API 一文件放在 `frontend/src/api/<module>/*Api.ts`。

## Backend

后端是一个 Scala 大服务，不再拆成多个独立微服务进程。逻辑模块放在：

- `backend/microservice/src/system`
- `backend/microservice/src/auth`
- `backend/microservice/src/user`
- `backend/microservice/src/level`
- `backend/microservice/src/admin`

每个业务模块按以下目录组织：

- `api`: API request/response/endpoint 契约。
- `objects`: 领域对象。
- `routes`: HTTP route。
- `tables`: 数据库表/投影对象。
- `utils`: 模块工具、service trait 或辅助逻辑。

### 后端 API 文件约定

`backend/microservice/src/**/api/*Api.scala` 只保留实际参与运行的内容：

- request body case class 和 JSON codec。
- `APIMessage` / `APIWithTokenMessage` 业务执行对象。
- 当前 API 专用错误对象。

接口名称、HTTP method、path 和业务说明不再写成未被运行时引用的 `*Endpoint` object。此类说明统一维护在文档中，例如 `docs/api-inventory.md`。真实路由以 `routes` 目录中的 http4s route 匹配为准，前端契约以 `frontend/src/api/api-contracts.ts` 和具体 API 文件为准。

根级目录：

- `backend/microservice/src/Main.scala`: 启动入口。
- `backend/microservice/src/routes`: 根路由挂载。
- `backend/microservice/src/core`: 跨模块基础设施。

完整 API 清单见 `docs/api-inventory.md`，完整对象清单见 `docs/object-inventory.md`。
