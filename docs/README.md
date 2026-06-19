# 项目文档

本目录集中说明 UGC 关卡平台的代码架构、当前能力与后续改进方向。

## 文档索引

| 文档 | 内容 |
| --- | --- |
| [frontend-architecture.md](./frontend-architecture.md) | 前端目录分层、路由、API 契约、页面与游戏引擎 |
| [../frontend/src/api/ARCHITECTURE.md](../frontend/src/api/ARCHITECTURE.md) | 前后端 API 子目录对齐约定与校验 |
| [../frontend/src/page/ARCHITECTURE.md](../frontend/src/page/ARCHITECTURE.md) | `page/` 域划分、复杂页拆分清单与约定 |
| [backend-architecture.md](./backend-architecture.md) | Scala 后端模块、APIMessage 模式、存储与 API 约定 |
| [current-status.md](./current-status.md) | 当前已实现的功能、演示账号、已知限制 |
| [roadmap.md](./roadmap.md) | 后续改进优先级与方向 |

## 快速启动

```bash
npm install
npm run dev          # 同时启动 Scala 后端 (3000) 与 Vite 前端 (5173)
npm run check        # 前端 TypeScript 类型检查
npm test             # 前端单元测试
```

后端单独启动：`npm run dev:backend`（等价于 `sbt run`）。

如需 PostgreSQL 持久化，见 [backend-architecture.md](./backend-architecture.md) 中的 JDBC 配置说明。

## 仓库结构概览

```text
backend/microservice/src/   # Scala/http4s 后端（唯一运行时后端）
frontend/src/               # React + Vite 前端
docs/                       # 本目录
scripts/dev.mjs             # 前后端并发启动脚本
```

旧版 Node.js/Express 后端（`src/backend`）与旧 `data/` 目录已移除，不再维护。
