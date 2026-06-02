# API Alignment

当前项目按一个 Scala 大服务组织后端，逻辑模块拆在 `backend/microservice/src/<module>` 下。前端 API 与对象按同样模块拆在 `frontend/src/api/<module>` 和 `frontend/src/objects/<module>`。

完整 API 对照表见 `docs/api-inventory.md`。
完整 object 对照表见 `docs/object-inventory.md`。

## Backend Layout

- `backend/microservice/src/Main.scala`: Scala/http4s 启动入口。
- `backend/microservice/src/routes`: 根路由挂载。
- `backend/microservice/src/core`: 数据库配置、默认 service、HTTP 错误等跨模块基础代码。
- `backend/microservice/src/<module>/api`: 每个 API 一个文件，例如 `CreateLevelApi.scala`。
- `backend/microservice/src/<module>/objects`: 业务对象定义。
- `backend/microservice/src/<module>/routes`: HTTP route。
- `backend/microservice/src/<module>/tables`: 存储层表/投影对象。
- `backend/microservice/src/<module>/utils`: 模块内工具或 service 接口。

当前模块包括 `system`、`auth`、`user`、`level`、`admin`。

## Frontend Layout

- `frontend/src/api/<module>/*Api.ts`: 每个 API 一个调用文件。
- `frontend/src/objects/<module>/*.ts`: 前端对象和 Zod schema。
- `frontend/src/api/*-api.ts`: 兼容聚合导出，页面可以继续从旧入口导入。
- `frontend/src/api/api-contracts.ts`: 兼容旧契约入口，后续可以继续按对象文件拆薄。

## One-To-One Rule

后端 `backend/microservice/src/**/api/*Api.scala` 与前端 `frontend/src/api/**/*Api.ts` 文件名保持一一对应。当前对应文件名包括：

- `HealthApi`
- `GetBackendUsersApi`
- `BindBackendUserApi`
- `GetUserProfileApi`
- `CreateLevelApi`
- `SubmitLevelApi`
- `GetPublishedLevelsApi`
- `GetPublishedLevelApi`
- `GetLevelCommentsApi`
- `CreateCommentApi`
- `GetFavoriteLevelsApi`
- `FavoriteLevelApi`
- `UnfavoriteLevelApi`
- `RateLevelApi`
- `GetAdminCommentsApi`
- `DeleteCommentApi`
- `GetPendingSubmissionsApi`
- `ReviewSubmissionApi`
