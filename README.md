# UGC Level Platform

## 项目概述

面向课程与演示的全栈 UGC 关卡平台（灵感来自 Angry Birds 类玩法）。设计师创建关卡并提交审核，管理员审核发布，玩家在地图中选关、游玩、评分、收藏与评论。系统还包含总监管理员的 UI 定制能力，以及玩家商店、社交、备战等扩展页面。

详细架构与现状说明见 [`docs/`](./docs/README.md)。

## 核心能力

- **设计师**：可视化关卡编辑器（DesignerPage）、地形/实体编辑、提交审核、自定义鸟类设计
- **普通管理员（Standard）**：关卡审核、社区评论管理、鸟类设计审核
- **总监管理员（Director）**：UI 页面/按钮/地图配置、关卡槽位分配、鸟类技能实验室
- **玩家**：关卡地图、物理引擎游玩、评分/收藏/评论、商店与备战等

## 技术栈

| 层 | 技术 |
| --- | --- |
| 前端 | React 19 + TypeScript + Vite 7 + Matter.js |
| 后端 | Scala 3 + http4s + cats-effect + Circe |
| 契约校验 | 前端 Zod schema（`frontend/src/objects/`） |
| 存储 | 默认 in-memory；可选 PostgreSQL/JDBC |

旧版 Node.js/Express 后端（`src/backend`）已移除，运行时后端仅为 `backend/microservice/`。

## 本地开发

安装依赖：

```bash
npm install
```

同时启动前后端（推荐）：

```bash
npm run dev
```

或分别启动：

```bash
npm run dev:backend    # sbt run，端口 3000
npm run dev:frontend   # Vite，端口 5173
```

| 服务 | 地址 |
| --- | --- |
| 前端 | http://localhost:5173 |
| 后端 | http://localhost:3000 |

其他命令：

```bash
npm run check    # 前端 TypeScript 类型检查
npm run build    # 前端生产构建
npm test         # 前端单元测试
sbt compile      # Scala 编译
```

PostgreSQL 持久化见 [`docs/backend-architecture.md`](./docs/backend-architecture.md)。

## 类型安全设计

前后端通过**同名 API 文件 + 对齐的领域对象**保持契约一致：

- 前端：`frontend/src/api/<module>/*Api.ts` + `frontend/src/objects/<module>/*.ts`（Zod）
- 后端：`backend/microservice/src/<module>/api/*Api.scala` + `objects/*.scala`（Circe）

前端 `client.request()` 对所有成功响应做 Zod 解析；后端 APIMessage 返回 `Either[HttpError, A]`，统一包装为 `{ success, data }` 或 `{ success: false, error }`。

认证上下文通过请求头 **`x-user-id`** 传递（演示方案，非生产级认证）。

## 登录与演示账号

前端提供 mock 登录（localStorage），需绑定后端演示用户后才能调用 API：

| 后端用户 ID | 角色 | 管理员等级 |
| --- | --- | --- |
| `player-1` | 玩家 | — |
| `designer-1` | 设计师 | — |
| `admin-1` | 普通管理员 | standard |
| `admin-director-1` | 总监管理员 | director |

注册规则：玩家仅需昵称+密码；设计师/管理员注册需验证码 `66260696`。

## 演示步骤（课程展示）

1. 打开 http://localhost:5173，注册并登录设计师账号
2. 在设置中绑定 `designer-1`
3. 进入 `/designer/design` 创建关卡并提交审核
4. 切换绑定 `admin-1`，进入 `/admin/proposals` 批准关卡
5. 切换绑定 `player-1`，在关卡地图中选关游玩并评分
6. （可选）绑定 `admin-director-1`，进入 `/director_console` 体验 UI 定制

完整流程与限制见 [`docs/current-status.md`](./docs/current-status.md)。

## 最小 API 示例

### 通用说明

- 基础地址：`http://localhost:3000`
- 请求头：`x-user-id: <user-id>`
- 成功响应：`{ "success": true, "data": { ... } }`

### 创建关卡

```http
POST /designer/levels HTTP/1.1
Host: localhost:3000
Content-Type: application/json
x-user-id: designer-1

{
  "title": "Starter Level",
  "description": "A simple demo level",
  "data": { "world": { "width": 1200, "height": 800, "gravity": 9.8 }, "birdInventory": { "basic": 3 }, "obstacles": [], "enemies": [] }
}
```

### 提交审核

```http
POST /designer/submissions HTTP/1.1
Content-Type: application/json
x-user-id: designer-1

{ "levelId": "level-1" }
```

### 管理员审核

```http
POST /admin/submissions/submission-1/review HTTP/1.1
Content-Type: application/json
x-user-id: admin-1

{ "status": "approved", "reviewNote": "Looks good" }
```

### 玩家评分

```http
POST /player/levels/level-1/ratings HTTP/1.1
Content-Type: application/json
x-user-id: player-1

{ "score": 5 }
```

前端对应 schema 见 `frontend/src/objects/level/`；完整 API 说明见 [`docs/backend-architecture.md`](./docs/backend-architecture.md) 与 `backend/backend_ReadMe.md`。

## 文档

| 文档 | 说明 |
| --- | --- |
| [docs/README.md](./docs/README.md) | 文档索引 |
| [docs/frontend-architecture.md](./docs/frontend-architecture.md) | 前端架构 |
| [docs/backend-architecture.md](./docs/backend-architecture.md) | 后端架构 |
| [docs/current-status.md](./docs/current-status.md) | 当前能力与限制 |
| [docs/roadmap.md](./docs/roadmap.md) | 改进方向 |
