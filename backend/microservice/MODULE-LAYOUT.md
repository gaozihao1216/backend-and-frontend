# 业务模块目录布局

后端模块结构规范已统一收口到：

- [`docs/backend-structure-standard.md`](../../docs/backend-structure-standard.md)
- [`backend/microservice/OBJECTS.md`](./OBJECTS.md)

本文件保留为后端目录下的入口，避免维护多份互相冲突的目录说明。

核心结论：

- `api/` 只放 `*Api.scala`，定义 `XxxAPIMessage`。
- `objects/` 放领域对象、请求对象、响应对象、错误对象，不再单独使用请求体目录。
- `validation/`、`support/`、`AccessControl` 对外统一返回 `IO[Either[HttpError, A]]`。
- API 内部不得再引入旧的流程包装类型。
- `tables/` 每个表按 `*Row`、`*Table`、`*TableInitializer` 组织。
- 跨模块调用通过提供方 `api/internal/`，在同一 `Connection` 内用 `PlanSteps.runApi(...)`。
