# 前端架构

## 技术栈

- **React 19** + **TypeScript** + **Vite 7**
- **Zod**：运行时校验 API 响应与页面侧数据结构
- **Matter.js**：2D 物理引擎，驱动关卡游玩与设计预览
- 无 React Router：使用 `window.location.pathname` + `history.pushState` 做轻量路由

开发时 Vite 将 API 请求代理到 `http://localhost:3000`（见根目录 `vite.config.ts`）。

## 目录结构

```text
frontend/src/
├── api/              # HTTP 调用，按后端模块拆分；一 API 一文件
├── objects/          # Zod schema 与 TypeScript 类型，与后端 objects 对齐
├── page/             # 页面入口（按 pathname 挂载）
├── component/        # 可复用 UI 与业务区域组件
├── hook/             # React hooks（含 designer-page 子目录）
├── lib/              # 纯逻辑：auth、配置、游戏引擎、UI 运行时等
├── store/            # 轻量前端状态
├── shared/           # 关卡种子数据等共享静态资源
├── styles.css
├── App.tsx           # 路由分流与认证会话
└── main.tsx
```

### API 层

- 统一入口：`frontend/src/api/client.ts` 的 `request(path, init, responseSchema)`
- 每个 API 独立文件，例如 `frontend/src/api/level/CreateLevelApi.ts`
- 模块聚合导出保留在 `*-api.ts`（如 `designer-api.ts`、`admin-api.ts`），供旧页面兼容导入
- 所有成功响应经 `createSuccessResponseSchema` 包装后再用 Zod 解析，失败时抛出结构化错误

### Objects 层

- 路径：`frontend/src/objects/<module>/<object>.ts`（kebab-case 文件名）
- 类型名与 Scala 后端对象名一致（如 `Level`、`BackendUser`）
- 模块包括：`system`、`auth`、`user`、`level`、`admin`、`bird`、`ui-customization` 等

前后端对齐原则：**同名 API 文件 + 同名领域对象**，便于从前端调用追到后端实现。

## 路由与页面

`App.tsx` 根据 pathname 渲染不同页面，主要路径如下：

| 路径前缀 | 角色/用途 |
| --- | --- |
| `/` | 登录与角色选择 |
| `/designer` | 设计师主页、作品集、鸟类设计 |
| `/designer/design` | 关卡编辑器（DesignerPage） |
| `/player_*`、`/community_hall`、`/levels/:id` | 玩家地图、商店、社交、备战、关卡游玩 |
| `/admin/proposals` | 普通管理员：关卡与鸟类审核 |
| `/director_console` | 总监管理员：UI 定制、关卡界面、技能实验室等 |
| `/dynamic_page` | 由 PageConfig 驱动的动态页面 |

未登录用户会被引导至认证页；登录态通过 `localStorage` 持久化（mock auth，见 [current-status.md](./current-status.md)）。

## 核心子系统

### 1. 认证与后端绑定

- `lib/auth.ts`：本地注册/登录（演示用），角色为 player / designer / admin
- `component/BackendBindingPanel.tsx`：将本地身份绑定到后端演示账号（`player-1`、`designer-1`、`admin-1` 等）
- API 请求通过 `x-user-id` 请求头传递后端用户 ID

### 2. 设计师编辑器（DesignerPage）

复杂页面已拆分为 hook + component + lib + objects 四层，详见 `frontend/src/page/DesignerPage/ARCHITECTURE.md`。

职责划分：

- **hooks**：draft、levelData、undo/redo、备份、地面编辑、提交 API
- **components**：表单、画布、备份面板、设计手册等展示块
- **lib/game-engine**：物理模拟、实体放置、技能系统

### 3. 游戏引擎

路径：`frontend/src/lib/game-engine/`

- `game-session/`：Matter.js 引擎生命周期、物理 settling、关卡加载
- `skills/`：技能规格、执行器、状态效果、区域查询
- `fracture` 等：障碍物破碎表现

设计器与玩家游玩共用同一套引擎类型（`objects/level/level-data.ts`）。

### 4. UI 定制与动态渲染

总监管理员可通过后端 API 配置页面结构，前端负责渲染：

- `objects/ui-customization/`：`PageConfig`、按钮模板、拉伸视觉模板、关卡地图结构
- `component/ui-renderer/`：`DynamicPageRenderer`、`SharedLevelMapRenderer` 等
- `lib/ui-customization.ts`、`lib/shared-level-map-persistence.ts`：本地缓存与 API  hydration

玩家侧 UI 运行时数据通过 `/player/ui/*` 接口拉取（商店、签到、进度等）。

### 5. 页面双模式

`PageDualModeHost` 支持同一 URL 在「实际业务页」与「总监预览/编辑模式」间切换，用于 UI 定制工作流。

## 数据流示意

```text
Page → *Api.ts → client.request → Scala 后端
                ↓ Zod parse
              objects/*.ts 类型
                ↓
         component 渲染 / lib 纯逻辑
```

## 测试与质量

- 测试文件：`frontend/src/**/*.test.ts`（Node 内置 test runner + tsx）
- 类型检查：`npm run check`（`tsc --noEmit`）
- 部分测试覆盖 API proxy 路径、游戏引擎技能规格、物理 settling 等

## 与后端协作约定

1. 新增 API 时，同时添加 `frontend/src/api/.../XxxApi.ts` 与对应 Zod schema
2. 在 `vite.config.ts` 的 `server.proxy` 中注册新路径前缀
3. 响应结构必须与后端 `ApiSuccess(data)` / `ApiFailure(error)` 一致
