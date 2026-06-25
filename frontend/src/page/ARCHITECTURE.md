# Frontend Page Architecture

## Directory layout

```text
page/
├── shared/          # 渲染基础设施（双模式、静态注册表、动态 Host）
├── player/          # 玩家功能页（含 shared/ 跨页小组件）
├── admin/           # 标准管理员页
├── designer/        # 设计师页（含 DesignerLevelEditorPage/ 复杂拆分）
├── director/        # 总监控制台（含 shared/ 跨页小组件）
└── profile/         # 用户资料
```

路由入口仍在 `App.tsx`（pathname 分流）；业务页通过 `shared/StaticPageRenderer.tsx` 的 `pageId` 注册表挂载。

## 页面入口约定

| 形态 | 路径 | 适用 |
| --- | --- | --- |
| 目录 + `index.tsx` | `page/<domain>/<Name>/index.tsx` | 复杂页：只负责组装 hook 与 workspace 组件 |
| 单文件 | `page/<domain>/<Name>Page.tsx` | 简单页：体量小、无独立 hook 层 |

判断标准：state/handlers 超过一屏、或 JSX 超过 ~300 行时，优先拆为 `index.tsx` + 同目录 `hooks/` + 同目录 `components/`。

## 分层约定

复杂页面拆为四层（与 `designer/DesignerLevelEditorPage/` 相同）：

| 层 | 路径 | 职责 |
| --- | --- | --- |
| 页面入口 | `page/<domain>/<Name>/index.tsx` | 组装 hook + 组件，不写 API 细节 |
| Hook | `page/<domain>/<Name>/hooks/` | 状态、加载、业务 actions；导出 view model |
| 组件 | `page/<domain>/<Name>/components/` | 该页专用 UI；子流程可用 nested 子目录（如 `panel-create/`） |
| 域内共享组件 | `page/<domain>/shared/` | 同角色多页复用（如 `director/shared/TemplateCategoryFilter`、`player/shared/PageFeedback`） |
| 跨域共享组件 | `components/` | 动态 UI renderer、关卡预览、App 级绑定/设置等跨页面组件 |
| 共享 Hook | `page/shared/hooks/` | 动态 UI runtime、素材加载、模板库等跨页面 hook |
| 页面函数 | `page/<domain>/<Name>/function/` | 只服务该页的纯函数、DOM 辅助、序列化 |
| 全局工具 | `lib/` | 跨页面或跨域复用的纯函数、runtime、引擎逻辑 |
| 页面对象 | `page/<domain>/<Name>/objects/` | 页面级 props、draft、步骤枚举等 |
| 全局对象 | `objects/` | 后端镜像 schema、API 合同、跨页共享领域对象 |

**不再**使用 `component/<domain>-page/` 平铺目录；页面 UI 与 `page/<domain>/<Name>/` 同位存放。

跨模块复用组件放在顶层 `components/`；`page/shared/` 只保留页面运行基础设施与共享 hooks；不再使用旧的顶层 `component/` 目录。

## 已完成拆分（组件已迁入 page 目录）

| 页面 | Hook | 组件目录 |
| --- | --- | --- |
| `designer/DesignerLevelEditorPage/` | `hooks/useDesignerLevelEditorViewModel` + 领域 hooks | `components/design/`、`components/editor/` 等子目录 |
| `designer/DesignerBirdLabPage/` | `hooks/useDesignerBirdLab` | `components/` + `objects/` |
| `designer/DesignerPortfolioPage/` | `hooks/useDesignerPortfolio` | `components/` + `objects/` |
| `designer/DesignerResubmitPage/` | `hooks/useDesignerResubmit` | `components/` + `objects/` |
| `player/PlayerSocialPage/` | `hooks/usePlayerSocial` | `components/` + `player/shared/PageFeedback` |
| `player/PlayerPreparationPage/` | `hooks/usePlayerPreparation` | `components/` + `player/shared/PageFeedback` |
| `director/DirectorLevelInterfacePage/` | `hooks/useDirectorLevelInterface` | `components/`（含地图/按钮格式编辑器） |
| `director/DirectorPageBuilderPage/` | `hooks/useDirectorPageBuilder` | `components/` |
| `director/DirectorButtonTemplatesPage/` | `hooks/useDirectorButtonTemplates` | `components/` |
| `director/DirectorButtonDesignPage/` | `hooks/useDirectorButtonDesign` | `components/` |
| `director/DirectorPanelCreatePage/` | `hooks/useDirectorPanelCreate` | `components/` + `components/panel-create/` |
| `director/DirectorBirdSkillLabPage/` | （页内 state） | `components/` |
| `director/DirectorLevelBackgroundTemplatesPage/` | `page/shared/hooks/useDirectorTemplateLibrary` | `components/` |
| `director/DirectorLevelAssignmentPage/` | （页内 state） | `components/BirdPoolConfigPanel` + `components/level/LevelPreviewCard` |
| `admin/AdminProposalReviewPage/` | — | `components/AdminProposalReviewContent`（动态 UI widget 亦引用此路径） |
| `admin/AdminAuditLogsPage/`、`AdminCommunityPage/`、`AdminShopPage/` | （页内 state） | `components/` + `objects/` |
| `director/DirectorButtonConfigPage/`、`DirectorUiCustomizationPage/`、`DirectorWorkbenchPage/` | （页内 state） | `components/` + `objects/` |
| `player/PlayerCommunityPage/`、`PlayerShopPage/` | （页内 state） | `components/` + `objects/` |
| `profile/UserProfilePage/` | （页内 state） | `components/` + `objects/` |

总监构建工具的页面私有函数与类型跟随页面放入各自 `function/`、`objects/`；通用渲染在 `components/ui-renderer/`；跨页关卡预览用 `components/level/LevelPreviewCard`。

## 后续拆分准则

当前不再保留顶层单文件页面。目录页若继续增长，应优先把状态和副作用迁入同页 `hooks/`，再把列表、表单、工具栏等 JSX 迁入同页 `components/`。

## 已移除的遗留页

- `RoleHomePage` / `PlayerPage` — 已被 config-driven 主页 + `PageDualModeHost` 取代
- `DesignerHomePage` — 已被 `designer.home` 动态页取代
- `component/director-page/`、`component/player-page/`、`component/designer-page/` — 已迁入对应 `page/` 子目录
- `frontend/src/component/` — 已迁入 `page/**/components/` 与顶层 `components/`
