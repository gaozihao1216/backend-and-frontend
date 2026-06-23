# Frontend Page Architecture

## Directory layout

```text
page/
├── shared/          # 渲染基础设施（双模式、静态注册表、动态 Host）
├── player/          # 玩家功能页（含 shared/ 跨页小组件）
├── admin/           # 标准管理员页
├── designer/        # 设计师页（含 DesignerPage/ 复杂拆分）
├── director/        # 总监控制台（含 shared/ 跨页小组件）
└── profile/         # 用户资料
```

路由入口仍在 `App.tsx`（pathname 分流）；业务页通过 `shared/StaticPageRenderer.tsx` 的 `pageId` 注册表挂载。

## 页面入口约定

| 形态 | 路径 | 适用 |
| --- | --- | --- |
| 目录 + `index.tsx` | `page/<domain>/<Name>/index.tsx` | 复杂页：只负责组装 hook 与 workspace 组件 |
| 单文件 | `page/<domain>/<Name>Page.tsx` | 简单页：体量小、无独立 hook 层 |

判断标准：state/handlers 超过一屏、或 JSX 超过 ~300 行时，优先拆为 `index.tsx` + `hook/<domain>-page/` + **同目录 `components/`**。

## 分层约定

复杂页面拆为四层（与 `designer/DesignerPage/` 相同）：

| 层 | 路径 | 职责 |
| --- | --- | --- |
| 页面入口 | `page/<domain>/<Name>/index.tsx` | 组装 hook + 组件，不写 API 细节 |
| Hook | `hook/<domain>-page/` | 状态、加载、业务 actions；导出 view model |
| 组件 | `page/<domain>/<Name>/components/` | 该页专用 UI；子流程可用 nested 子目录（如 `panel-create/`） |
| 域内共享组件 | `page/<domain>/shared/` | 同角色多页复用（如 `director/shared/TemplateCategoryFilter`、`player/shared/PageFeedback`） |
| 工具 | `lib/<domain>-page/` 或 `lib/` | 纯函数、DOM 辅助、序列化 |
| 类型 | `objects/<domain>-page/` | 页面级 props、draft、步骤枚举等 |

**不再**使用 `component/<domain>-page/` 平铺目录；页面 UI 与 `page/<domain>/<Name>/` 同位存放。

跨模块复用仍放在 `component/`（如 `component/designer/LevelEditorCanvas`、`component/ui-renderer/`、`component/level/`）。

## 已完成拆分（组件已迁入 page 目录）

| 页面 | Hook | 组件目录 |
| --- | --- | --- |
| `designer/DesignerPage/` | `hook/designer-page/useDesignerPageViewModel` + 领域 hooks | `components/design/` 等子目录 — 详见 `designer/DesignerPage/ARCHITECTURE.md` |
| `player/PlayerSocialPage/` | `usePlayerSocial` | `components/` + `player/shared/PageFeedback` |
| `player/PlayerPreparationPage/` | `usePlayerPreparation` | `components/` + `player/shared/PageFeedback` |
| `director/DirectorLevelInterfacePage/` | `useDirectorLevelInterface` | `components/`（含地图/按钮格式编辑器） |
| `director/DirectorPageBuilderPage/` | `useDirectorPageBuilder` | `components/` |
| `director/DirectorButtonTemplatesPage/` | `useDirectorButtonTemplates` | `components/` |
| `director/DirectorButtonDesignPage/` | `useDirectorButtonDesign` | `components/` |
| `director/DirectorPanelCreatePage/` | `useDirectorPanelCreate` | `components/` + `components/panel-create/` |
| `director/DirectorBirdSkillLabPage/` | （页内 state） | `components/` |
| `director/DirectorLevelBackgroundTemplatesPage/` | `useDirectorTemplateLibrary` | `components/` |
| `director/DirectorLevelAssignmentPage/` | （页内 state） | `components/BirdPoolConfigPanel`；`LevelPreviewCard` 仍用 `component/level/` |
| `admin/AdminPage/` | — | `components/AdminProposalReviewContent`（动态 UI widget 亦引用此路径） |

总监构建工具共用 `lib/director-page/`、`objects/director-page/`；通用渲染仍在 `component/ui-renderer/`；跨页关卡预览仍用 `component/level/LevelPreviewCard`。

## 仍为单文件的页面（可选后续拆分）

体量适中，当前保持单文件即可；若继续增长再按上表模式拆分：

| 文件 | 约行数 | 说明 |
| --- | ---: | --- |
| `director/DirectorUiCustomizationPage.tsx` | ~350 | UI 定制总览 |
| `director/DirectorButtonConfigPage.tsx` | ~320 | 按钮配置 |
| `designer/DesignerBirdLabPage.tsx` | ~350 | 鸟类实验室 |
| `player/PlayerCommunityPage.tsx` | ~190 | 社区大厅 |
| `admin/AdminShopPage.tsx` 等 | &lt;200 | 其它管理列表页 |

## 已移除的遗留页

- `RoleHomePage` / `PlayerPage` — 已被 config-driven 主页 + `PageDualModeHost` 取代
- `DesignerHomePage` — 已被 `designer.home` 动态页取代
- `component/director-page/`、`component/player-page/`、`component/designer-page/` — 已迁入对应 `page/` 子目录
