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
├── objects/          # Zod/TS 类型（后端对齐 + 跨页共享领域对象）
├── page/             # 页面入口（按域：shared/ player/ admin/ designer/ director/ profile/）
│   └── shared/       # 页面渲染基础设施与跨页面 hook
├── components/       # 跨页面复用 UI
├── system/           # API 基础设施与 app 级逻辑（auth/config/route access）
├── level/            # 关卡/地形/设计器领域函数
├── player/           # 玩家领域函数
├── game/engine/      # 游戏物理引擎、战斗、鸟类技能、渲染
├── shared/           # 关卡种子数据等共享静态资源
├── styles.css
├── App.tsx           # 路由分流与认证会话
└── main.tsx
```

### API 层

- 统一入口：`frontend/src/api/client.ts` 的 `request(path, init, responseSchema)`
- 子目录与后端 `backend/microservice/src/<module>/api/` **对齐**（见 [`frontend/src/api/ARCHITECTURE.md`](../frontend/src/api/ARCHITECTURE.md)）
- 示例：`level/api/design/CreateLevelApi.scala` ↔ `api/level/design/CreateLevelApi.ts`
- 模块聚合导出保留在 `*-api.ts`（如 `designer-api.ts`、`admin-api.ts`），供页面快捷 import
- `npm test` 含 `api-alignment.test.ts`，校验前后端 `*Api` 文件布局一致
- 所有成功响应经 `createSuccessResponseSchema` 包装后再用 Zod 解析，失败时抛出结构化错误

### Objects 层

- 路径：`frontend/src/objects/<module>/…`（子目录镜像后端 `*/objects/` 布局，见 [`frontend/src/objects/ARCHITECTURE.md`](../frontend/src/objects/ARCHITECTURE.md)）
- 类型名与 Scala 后端对象名一致（如 `Level`、`BackendUser`）
- 后端对齐域：`system`、`auth`、`user`、`level`（含 `level/`、`social/`、`terrain/` 等子目录）、`admin`、`bird`、`player`、`ui`
- 前端专用：`ui-customization/`（默认配置、路由树、关卡地图结构）；页面私有类型放在对应 `page/<domain>/<PageName>/objects/`；关卡种子数据在 `shared/levels/`

前后端对齐原则：**同名 API 文件 + 同模块子路径 + 同名领域对象**（`user` 模块中挂载 `/auth` 的两个 API 在前端放在 `api/auth/`）。

## 路由与页面

`App.tsx` 根据 pathname 渲染不同页面，主要路径如下：

| 路径前缀 | 角色/用途 |
| --- | --- |
| `/` | 登录与角色选择 |
| `/designer` | 设计师主页、作品集、鸟类设计 |
| `/designer/design` | 关卡编辑器（DesignerLevelEditorPage） |
| `/player_*`、`/community_hall`、`/levels/:id` | 玩家地图、商店、社交、备战、关卡游玩 |
| `/admin/proposals` | 普通管理员：关卡与鸟类审核 |
| `/director_console` | 总监管理员：UI 定制、关卡界面、技能实验室等 |
| `/dynamic_page` | 由 PageConfig 驱动的动态页面 |

未登录用户会被引导至认证页；登录态通过 `localStorage` 持久化（mock auth，见 [current-status.md](./current-status.md)）。

## 核心子系统

### 1. 认证与后端绑定

- `system/app/auth.ts`：本地注册/登录（演示用），角色为 player / designer / admin
- `components/auth/BackendBindingPanel.tsx`：将本地身份绑定到后端演示账号（`player-1`、`designer-1`、`admin-1` 等）
- API 请求通过 `x-user-id` 请求头传递后端用户 ID

### 2. 页面组织

`page/` 按角色域分子目录，详见 [`frontend/src/page/ARCHITECTURE.md`](../frontend/src/page/ARCHITECTURE.md)。

```text
page/
├── shared/     # PageDualModeHost、StaticPageRenderer、DynamicPageHost、共享 components/function/hooks
├── player/     # 商店、社交、备战、社区
├── admin/      # 审核、社区管理
├── designer/   # 作品集、关卡编辑、鸟类实验室
├── director/   # UI 定制、页面构建、模板与面板编辑器
└── profile/    # 用户资料

components/
├── app/         # App 级设置入口
├── auth/        # 登录、绑定等跨页面认证 UI
├── level/       # 关卡预览、游玩画布
└── page/        # 页面模式切换等通用页面控件

page/shared/
├── components/ui-renderer/ # 动态 UI 渲染器
├── hooks/                  # 按 template、visual-asset、level-map 等分类
└── function/               # 动态页面配置、runtime、地图、背景模板、UI design
```

**复杂页面四层拆分**（入口薄、逻辑进同页 hook）：

| 层 | 路径示例 |
| --- | --- |
| 入口 | `page/director/DirectorPageBuilderPage/index.tsx` |
| Hook | `page/director/DirectorPageBuilderPage/hooks/useDirectorPageBuilder.ts` |
| 组件 | `page/director/DirectorPageBuilderPage/components/*` |
| 函数/类型 | 同页面 `function/`、同页面 `objects/`，跨页共享进入明确领域目录或 `objects/` |

已拆分页面清单见 `page/ARCHITECTURE.md` 的「已完成拆分」表。

当前不再保留单文件业务页；所有业务页都使用目录 + `index.tsx`，并配套 `components/`、`hooks/`、`objects/`。

### 3. 非页面领域目录

旧的 `frontend/src/lib/` 已移除。跨页面逻辑按职责进入明确目录：

| 目录 | 职责 |
| --- | --- |
| `system/app/` | auth、config、route access、pageId resolver 等 app 级逻辑 |
| `level/function/` | 关卡、地形、设计器编辑、LevelSource、鸟池规范化 |
| `player/function/` | 玩家鸟池解析、玩家选鸟本地状态 |
| `game/engine/` | Matter.js 物理会话、战斗、鸟类技能、渲染、核心类型 |
| `page/shared/function/` | 动态页面配置、UI runtime、地图、背景模板、UI design |
| `page/director/shared/function/` | 总监端跨页模板选择、周签到面板配置 |

### 4. 设计师编辑器（DesignerLevelEditorPage）

详见 [`frontend/src/page/designer/DesignerLevelEditorPage/ARCHITECTURE.md`](../frontend/src/page/designer/DesignerLevelEditorPage/ARCHITECTURE.md)。

职责划分：

- **hooks**：draft、levelData、undo/redo、备份、地面编辑、提交 API
- **components**：表单、画布、备份面板、设计手册等展示块
- **level/function**：实体放置、地形编辑、关卡编辑辅助
- **game/engine**：物理模拟、战斗、技能系统

### 5. 玩家与总监复杂页

与 DesignerLevelEditorPage 同一模式，state 在页面 `hooks/`，JSX 在页面 `components/`：

- **玩家**：`PlayerSocialPage/`、`PlayerPreparationPage/` → `usePlayerSocial`、`usePlayerPreparation`
- **总监**：`DirectorLevelInterfacePage/`、`DirectorPageBuilderPage/`、`DirectorButtonTemplatesPage/`、`DirectorButtonDesignPage/`、`DirectorPanelCreatePage/` → 对应 `useDirector*` hook 与 workspace 组件

### 6. 游戏引擎

路径：`frontend/src/game/engine/`

- `core/`：引擎常量、核心类型
- `bird/`：鸟类定义、鸟池发射状态
- `combat/`：战斗参数、伤害、材质、断裂、裂纹
- `game-session/`：Matter.js 引擎生命周期、物理 settling、关卡加载
- `skills/`：技能规格、执行器、状态效果、区域查询
- `render/`：canvas 场景绘制
- `level/`：引擎测试/内置关卡数据出口

设计器与玩家游玩共用同一套引擎类型（`objects/level/level/level-data.ts`）。

### 7. UI 定制与动态渲染

总监管理员可通过后端 API 配置页面结构，前端负责渲染：

- `objects/ui/`：`PageConfig`、组件 schema、按钮/拉伸模板（镜像后端 `ui/objects/`）
- `objects/ui-customization/`：默认页面配置、normalizer、关卡地图结构等前端专用逻辑
- `page/shared/components/ui-renderer/`：`DynamicPageRenderer`、`SharedLevelMapRenderer` 等
- `page/shared/function/ui-config/`：本地缓存、发布/回滚、API hydration、视觉资源缓存
- `page/shared/function/ui-runtime/`：UI 数据 key 收集、按钮状态解析
- `page/shared/function/level-map/`：关卡地图路径、节点按钮、stage 结构
- `page/shared/function/ui-design/`：动态文本、艺术字、图案层、模板图片处理

玩家侧 UI 运行时数据通过 `/player/ui/*` 接口拉取（商店、签到、进度等）。

### 8. 页面双模式

`PageDualModeHost` 支持同一 URL 在「实际业务页」与「总监预览/编辑模式」间切换，用于 UI 定制工作流。

### 9. 状态管理

当前没有 Zustand store，也没有 `store/` 目录。全局状态主要通过：

- `system/app/auth.ts`：登录态与本地用户持久化
- `page/shared/function/ui-config/ui-customization.ts`：PageConfig 本地存储 + `useSyncExternalStore` 订阅
- `page/shared/function/ui-config/published-page-configs.ts`：已发布 PageConfig 缓存 + 订阅
- `page/shared/function/ui-config/ui-visual-asset-store.ts`：IndexedDB 视觉资源缓存

如后续引入 Zustand，应放在明确领域目录下，而不是重新建立混杂的全局 `lib`。

## 数据流示意

```text
Page → *Api.ts → client.request → Scala 后端
                ↓ Zod parse
              objects/*.ts 类型
                ↓
       page components 渲染 / function 领域逻辑
```

## 测试与质量

- 测试文件：`frontend/src/**/*.test.ts`（Node 内置 test runner + tsx）
- 类型检查：`npm run check`（`tsc --noEmit`）
- 部分测试覆盖 API proxy 路径、游戏引擎技能规格、物理 settling 等

## 与后端协作约定

1. 新增 API 时，同时添加 `frontend/src/api/.../XxxApi.ts` 与对应 Zod schema
2. 在 `vite.config.ts` 的 `server.proxy` 中注册新路径前缀
3. 响应结构必须与后端 `ApiSuccess(data)` / `ApiFailure(error)` 一致
