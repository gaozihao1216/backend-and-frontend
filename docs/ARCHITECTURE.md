# Project Architecture

## 1. 项目整体目标

这是一个前后端一体的 UGC level platform。核心业务是：设计师创建关卡，管理员审核提交，玩家游玩、评分、收藏和评论已发布关卡。

当前可运行主线是 TypeScript + React + Express：

- `frontend`：关卡设计器、玩家端、管理员端、认证 UI 和游戏画布。
- `backend`：Express API，承载用户、关卡、提交审核、评论、收藏、评分等服务。
- `shared`：前后端共享 Zod schema、API request/response schema、TypeScript 类型和初始关卡数据。
- `data`：本地开发 seed store 与 runtime store。
- `tests`：Node built-in test runner 覆盖后端 service/route、前端纯逻辑、API proxy 等。
- `CI`：GitHub Actions 固化 `check` / `test` / `build`。

仓库里还保留 Scala microservice 代码，位于 `src/main/scala/microservice`，用于课程/后续迁移讲解；当前 npm dev/test/build 主线不依赖它。

## 2. 顶层目录结构

- `frontend/src`：React 前端入口、页面、组件、API client、auth、本地编辑器逻辑和 Matter.js 游戏运行时。
- `src/backend`：Express app、routes、services、middleware、store 和 HTTP helper。
- `src/shared`：前后端共享 schema/type/API 契约和 starter level data。
- `src/main/scala/microservice`：Scala/http4s 微服务结构草稿，按 auth/user/level/admin/system 分模块。
- `scripts`：开发脚本，例如同时启动前后端的 `dev.mjs`。
- `data`：`backend-store.json` seed/demo 数据；本地 runtime store 使用 ignored 的 `backend-store.local.json`。
- `docs`：项目架构、API 对齐和 code review 说明文档。
- `.github/workflows`：GitHub Actions CI workflow。
- `package.json`：npm scripts、依赖和测试命令。
- `vite.config.ts`：Vite dev server、proxy 和前端 build 配置。

## 3. 前端架构

`frontend/src` 主要分为：

- `main.tsx`：React root 入口。
- `App.tsx`：轻量 pathname-based routing，没有引入 router library。
- `page/`：页面级入口，例如 `DesignerPage`、`PlayerPage`、`AdminPage`、`UserProfilePage`、社区页和 Designer home。
- `component/`：跨页面组件，包括 auth、role home/settings、game canvas、designer canvas/editor toolbar 等。
- `api/`：前端 API 封装。
- `lib/auth.ts`：localStorage/mock auth 模型。
- `lib/designer-level.ts`：设计器实体编辑纯逻辑。
- `lib/ground.ts`：地形/terrain 编辑、采样和碰撞相关纯逻辑。
- `game/`：Matter.js 游戏运行时、物理配置、破裂模型、绘制逻辑和 demo。

### 3.1 页面层

主要页面入口包括：

- `DesignerPage/index.tsx`：复杂关卡设计器页面。
- `DesignerHomePage.tsx` / `DesignerBirdLabPage.tsx`：设计师入口相关页面。
- `PlayerPage.tsx` / `PlayerCommunityPage.tsx`：玩家关卡列表、游玩、社区相关入口。
- `AdminPage.tsx` / `AdminCommunityPage.tsx`：管理员审核与社区管理。
- `UserProfilePage.tsx`：用户资料页。
- `AuthLandingPage.tsx`：登录/注册入口，位于 `component/auth`。

页面层主要负责：

- 组合 hooks。
- 做页面 mode/path routing。
- 连接 API 与 UI。
- 组装展示组件。
- 保留跨多个领域的协调逻辑。

### 3.2 API client 层

`frontend/src/src/api` 集中封装前端 API：

- `client.ts`：统一 `request(path, init, responseSchema)`，负责 fetch、超时、空响应/非 JSON 错误处理、成功响应 schema 校验。
- `auth-api.ts`：`/auth/backend-users`、`/auth/bind`。
- `user-api.ts`：`/users/:userId/profile`。
- `designer-api.ts`：设计师创建关卡、提交关卡。
- `player-api.ts`：玩家关卡列表、详情、评论、收藏、评分。
- `admin-api.ts`：管理员 pending submissions、review、comments 管理。
- `index.ts` / `api.ts`：对外 re-export。

`API_BASE_URL` 来自 `VITE_API_BASE_URL`，默认是空字符串。开发环境通常请求相对路径，例如 `/auth/bind`，再由 Vite proxy 转发到 backend `localhost:3000`。

当前已有 `frontend/src/src/api/proxy-coverage.test.ts`，会扫描前端 API request path，并断言它们被 `vite.config.ts` 的 proxy prefix 覆盖，避免再次出现 `/auth/bind` 打到 Vite dev server 返回 404 的问题。

### 3.3 Auth 前端模型

当前前端 auth 是 localStorage/mock auth，不是正式 session/JWT。

核心概念：

- `local auth user`：前端本地用户，保存在 localStorage，字段包括本地 `id`、`nickname`、`role`、`apiUserId`。
- `backend user`：后端 store 中的用户，例如 `player-1`、`designer-1`、`admin-1` 或绑定创建出的 `local-<role>-...` 用户。
- `bound user`：local auth user 通过 `/auth/bind` 绑定到 backend user 后，会把 backend user id 写入 `apiUserId`。
- `guest`：未登录状态，看到 `AuthLandingPage`。

关键函数：

- `loginWithLocalAuth` / `registerWithLocalAuth`：处理本地登录注册。
- `ensureBackendBoundAuthUser`：如果当前 local auth user 没有可用 `apiUserId`，会调用 `getBackendUsers` 和 `bindBackendUser` 完成后端绑定。
- `getBoundApiUserId`：从 local auth user 读取已绑定的 backend user id。
- `attachApiUserIdToAuthUser`：把绑定结果回写到本地用户库和当前 session。

后续 API 权限通过 `x-user-id` 传递 backend user id，由后端 `authenticate` 和 `requireRole` 校验。

## 4. 后端架构

`src/backend` 是当前可运行后端：

- `server.ts`：启动入口，监听 backend 端口。
- `app.ts`：Express app 组装、route 挂载、错误处理中间件。
- `routes/`：HTTP route handlers。
- `services/`：业务逻辑，不依赖 Express。
- `data/store.ts`：in-memory arrays + JSON persistence。
- `middleware/auth.ts`：`authenticate` 和 `requireRole`。
- `lib/http.ts`：`HttpError`、`parseOrThrow`、`success`、`errorResponse` 等 helper。

### 4.1 Express app 和 route 挂载

当前 `createApp()` 的主要挂载关系：

- `GET /health`
- Deprecated auth aliases：
  - `GET /users` -> `getBackendUsersHandler`
  - `POST /users/bind` -> `bindBackendUserHandler`
- `app.use("/auth", authRouter)`
  - `GET /auth/backend-users`
  - `POST /auth/bind`
- 从这里开始需要 `authenticate`
- `app.use("/users", userRouter)`
  - `GET /users/:userId/profile`
- `app.use("/designer", designerRouter)`
  - `POST /designer/levels`
  - `POST /designer/submissions`
- `app.use("/admin", adminRouter)`
  - `GET /admin/comments`
  - `DELETE /admin/comments/:commentId`
  - `GET /admin/submissions/pending`
  - `POST /admin/submissions/:submissionId/review`
- `app.use("/player", playerRouter)`
  - `GET /player/levels`
  - `GET /player/levels/:levelId`
  - `GET /player/levels/:levelId/comments`
  - `POST /player/levels/:levelId/comments`
  - `POST /player/levels/:levelId/favorite`
  - `DELETE /player/levels/:levelId/favorite`
  - `GET /player/favorites`
  - `POST /player/levels/:levelId/ratings`

所有未命中的 route 会被转换成结构化 404 JSON，而不是默认 HTML。

### 4.2 Route / Service / Store 分层

请求流：

```text
HTTP request
  -> route handler
  -> parse request with shared Zod schema
  -> service
  -> store arrays / saveStore
  -> validate response data with shared schema
  -> success/error JSON response
```

service 层职责：

- `auth-service.ts`：后端用户列表与 local auth user 绑定。
- `user-service.ts`：用户查询、资料页聚合、绑定用户创建/复用。
- `level-service.ts`：创建关卡、查询关卡、发布状态相关逻辑。
- `submission-service.ts`：提交、审核、状态流转。
- `comment-service.ts`：评论创建、查询、删除。
- `favorite-service.ts`：收藏/取消收藏。
- `rating-service.ts`：评分与平均分/评分数更新。

### 4.3 Auth 与权限

`authenticate` 从 request header 中读取 `x-user-id`，在 store 的 `users` 数组里查找对应用户，并写入 `req.currentUser`。

`requireRole(...roles)` 基于 `req.currentUser.role` 做角色限制：

- designer routes 使用 `requireRole("designer")`
- admin routes 使用 `requireRole("admin")`
- player routes 使用 `requireRole("player")`

前端 role UI 控制只是用户体验层，不是安全边界。真正的权限校验在后端 route middleware。

## 5. Shared 层

`src/shared` 是前后端契约层：

- `schemas/`：基础 Zod schemas，例如 user、level、submission、rating、comment、favorite、API response。
- `api/`：按 auth/user/designer/player/admin 拆分 request、response、objects。
- `levels/`：starter/default level data。
- `types.ts`：统一 re-export，前后端都从这里拿类型和 schema。

共享层定义：

- `LevelData`
- `User`
- `UserRole`
- API request/response schema
- 通用 success/error response schema
- starter level data

好处是：后端 route 会用同一套 schema 校验 request/response，前端 API client 也用同一套 schema 校验 response，减少前后端结构漂移。

## 6. 数据持久化与 store 设计

当前 store 设计：

- `data/backend-store.json`：tracked seed/demo data。
- `data/backend-store.local.json`：本地 runtime persistence，已被 `.gitignore` 忽略。
- 非 test 环境优先读取 local store。
- local store 不存在时，从 tracked seed 初始化。
- seed 也读取失败时，fallback 到 `createDefaultState()`。
- 非 test 环境 `saveStore()` 只写 local store。
- test 环境直接使用 default state，`saveStore()` no-op。
- `resetStore()` 用于测试隔离。

这样设计的原因：

- 本地注册、创建关卡、提交、收藏、评分、评论不会污染 Git tracked seed 文件。
- demo 初始数据仍可复现。
- 测试不依赖本地运行数据，也不会写 runtime store。

## 7. Auth / User / Role Flow

当前认证与绑定流程：

```text
guest
  -> local auth login/register
  -> local auth user
  -> GET /auth/backend-users
  -> POST /auth/bind
  -> backend user id saved as apiUserId
  -> frontend API request with x-user-id
  -> authenticate
  -> requireRole
  -> route handler
  -> service
```

角色：

- `player`
- `designer`
- `admin`

概念区别：

- `guest`：未登录。
- `local auth user`：浏览器 localStorage 中的模拟账号。
- `backend user`：后端 store 中参与权限和数据归属的用户。
- `bound user`：已将 local auth user 绑定到 backend user id。

当前 legacy 路径：

- `GET /users`
- `POST /users/bind`

它们是 deprecated auth aliases。新客户端应使用：

- `GET /auth/backend-users`
- `POST /auth/bind`

legacy aliases 暂时保留用于 backward compatibility，且复用与 `/auth` 相同的 handlers。

## 8. DesignerPage 重构后架构

`DesignerPage` 当前是：

```text
index.tsx 页面协调层
  + hooks 领域状态/actions
  + components 展示组件
  + functions/objects 页面私有工具和类型
```

更详细说明见 `frontend/src/page/DesignerPage/ARCHITECTURE.md`。

### 8.1 index.tsx 保留职责

`DesignerPage/index.tsx` 保留：

- 顶层 hook 组装。
- mode routing。
- `restoreDraft` / `restoreDraftAndClearHistory`。
- `switchDesignerPhase`。
- `handleDeleteSelected`。
- keyboard registration orchestration。
- 页面 JSX composition。

这些逻辑没有继续迁移，是因为它们跨多个 domain。留在页面协调层更清晰，也避免制造一个过大的 `useDesignerPage`。

### 8.2 DesignerPage hooks

实际存在的 hooks：

- `useDesignerDraft`：title、description、selectedTags、toggleTag。
- `useDesignerFeedback`：message、error。
- `useDesignerLevelDataController`：levelData、JSON、undo/redo、applyLevelDataUpdate。
- `useDesignerLevelSubmission`：createdLevels、submittedIds、handleCreate、handleSubmit。
- `useDesignerBackups`：localStorage persistence 与 designerBackups state。
- `useDesignerBackupActions`：handleCreateBackup、handleRestoreBackup。
- `useDesignerKeyboardActions`：Undo/Redo/Copy/Paste/Cut/Delete shortcut handlers。
- `useDesignerGroundActions`：terrain edit mode、ground toggle、boundary type、ceiling、point、void span actions。
- `useDesignerRotationActions`：handleRotationAngleChange。
- `useDesignerEditor`：entity editor state、selection、clipboard、grid、group selection。
- `useDesignerGroundEditor`：ground editor derived state。
- `useDesignerGroundTuning`：stroke simplify、breakpoint epsilon、material render tuning。
- `useDesignerKeyboardShortcuts`：window keyboard listener registration helper。

### 8.3 DesignerPage components

主要展示组件：

- `DesignerHeader`
- `LevelFormPanel`
- `DesignerEntityControls`
- `DesignerGridControls`
- `DesignerActionBar`
- `DesignerCanvasPanel`
- `DesignerBackupPanel`
- `DraftPreviewPanel`
- `DesignerCreateActions`
- `CreatedLevelsPanel`
- `GroundEditorToggleControls`
- `CeilingControls`
- `GroundPointControls`
- `VoidSpanControls`
- `ArchivePanel`
- `JsonCheckPanel`
- `SettingsPage`
- `DesignBookPage`
- `DesignBookPanel`
- `GroundTuningPanel`
- `DesignerWorkspace`

展示组件原则：

- 不持有核心业务 state。
- 不直接修改 `levelData`。
- 通过 props 接收数据和 callback。
- 负责 JSX 结构、布局和按钮绑定。

## 9. Vite dev proxy 与 API path 保护

前端开发环境请求相对路径，例如 `/auth/bind`。Vite dev server 通过 `vite.config.ts` 的 `server.proxy` 转发到 backend：

- `/health`
- `/auth`
- `/users`
- `/designer/levels`
- `/designer/submissions`
- `/admin/comments`
- `/admin/submissions`
- `/player/levels`
- `/player/favorites`

之前 `/auth` proxy 缺失，导致登录/注册页的 `/auth/bind` 请求落到 Vite dev server，返回 404。现在已补齐 `/auth`。

`frontend/src/src/api/proxy-coverage.test.ts` 会扫描 `frontend/src/src/api` 中的 request path，并断言每个前端 API path 都被某个 Vite proxy prefix 覆盖。

## 10. 测试体系

当前命令：

- `npm run check`：TypeScript no-emit type check。
- `npm test`：`node --import tsx --test src/**/*.test.ts`。
- `npm run build`：`tsc -p tsconfig.json && vite build`。

测试类型：

- 后端 service 测试：`src/backend/services/lifecycle.test.ts`。
- 后端 auth route handler 测试：`src/backend/routes/auth-routes.test.ts`。
- 前端 API proxy coverage：`frontend/src/src/api/proxy-coverage.test.ts`。
- 前端纯逻辑测试：`designer-level.test.ts`、`ground.test.ts`、`terrain.test.ts`。
- 游戏逻辑测试：`fracture-model.test.ts`。

当前有一个 legacy ground endpoint inference 测试被 skip。原因是旧的 point/stroke-based boundary construction 会在后续 Terrain Boundary V2 中重做，旧 endpoint inference expectation 不再是稳定产品需求。

## 11. CI

`.github/workflows/ci.yml`：

- 触发：`push` / `pull_request`
- 环境：`ubuntu-latest`
- Node：20
- env：`NODE_ENV=test`
- 步骤：
  - `npm ci`
  - `npm run check`
  - `npm test`
  - `npm run build`

CI 的意义：

- 防止类型错误进入主分支。
- 防止测试基线回退。
- 防止生产构建失败。
- 保护后续重构，尤其是 DesignerPage、API proxy、auth route 和 store 行为。

## 12. 当前架构边界与不建议继续强拆的地方

当前不建议继续强拆：

- 不建议抽 `useDesignerPage`，它容易变成 God Hook。
- 不建议继续迁移 `restoreDraft`，因为它跨 draft metadata、levelData/json、history、editor selection、ground selection。
- 不建议继续迁移 `switchDesignerPhase`，因为它跨 editor 和 ground editor。
- 不建议为了缩短 `index.tsx` 而拆 mode routing，顶层 mode 本来就是页面职责。
- 不建议删除 legacy `/users` 或 `/users/bind`，先保留 backward compatibility。
- 不建议现在重写 Terrain Boundary V2，它应该作为独立设计阶段。

## 13. 后续可能的演进方向

1. Terrain Boundary V2
   - 新地图边界表达方式。
   - 支持负斜率悬崖等复杂地形。
   - 替换旧 point/stroke endpoint inference。

2. Auth 正规化
   - 从 localStorage mock auth 走向真实 session/JWT。
   - 更明确的 backend user 创建流程。
   - 清理 demo/legacy auth alias。

3. API route constants
   - 统一 frontend API path、backend route、Vite proxy 配置。
   - 降低路径字符串漂移风险。

4. 后端集成测试
   - 更完整覆盖 designer/admin/player 主流程。
   - 在无需额外依赖或引入合适测试工具后，补充 app-level route tests。

5. 审核发布流程完善
   - create level。
   - submit。
   - admin review。
   - player visible。

## 14. Code Review 讲解顺序

建议明天口头讲解顺序：

1. 先讲项目整体分层：frontend、backend、shared、data、tests、CI。
2. 再讲前端/后端/shared 的边界：页面/API client、routes/services/store、Zod schema 契约。
3. 讲 DesignerPage 为什么拆、拆成什么：页面协调层、领域 hooks、展示组件。
4. 讲 API/Auth/proxy 问题如何被测试保护：`/auth` proxy、proxy coverage、auth route handler test。
5. 讲 backend-store seed/local 分离：为什么避免 Git 污染、test 如何隔离。
6. 讲测试与 CI：`check`、`test`、`build` 和 GitHub Actions。
7. 最后讲哪些地方暂时不继续改，以及未来方向：legacy routes、Terrain Boundary V2、正式 auth、API constants。
