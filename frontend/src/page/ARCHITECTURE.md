# Frontend Page Architecture

## Directory layout

```text
page/
├── shared/          # 渲染基础设施（双模式、静态注册表、动态 Host）
├── player/          # 玩家功能页
├── admin/           # 标准管理员页
├── designer/        # 设计师页（含 DesignerPage/ 复杂拆分）
├── director/        # 总监控制台与页面构建工具
└── profile/         # 用户资料
```

路由入口仍在 `App.tsx`（pathname 分流）；业务页通过 `shared/StaticPageRenderer.tsx` 的 `pageId` 注册表挂载。

## 页面入口约定

| 形态 | 路径 | 适用 |
| --- | --- | --- |
| 目录 + `index.tsx` | `page/<domain>/<Name>/index.tsx` | 复杂页：只负责组装 hook 与 workspace 组件 |
| 单文件 | `page/<domain>/<Name>Page.tsx` | 简单页：体量小、无独立 hook 层 |

判断标准：state/handlers 超过一屏、或 JSX 超过 ~300 行时，优先拆为 `index.tsx` + `hook/<domain>-page/` + `component/<domain>-page/`。

## 分层约定

复杂页面拆为四层（与 `designer/DesignerPage/` 相同）：

| 层 | 路径 | 职责 |
| --- | --- | --- |
| 页面入口 | `page/<domain>/<Name>/index.tsx` | 组装 hook + 组件，不写 API 细节 |
| Hook | `hook/<domain>-page/` | 状态、加载、业务 actions；导出 view model |
| 组件 | `component/<domain>-page/` | 纯展示，props / view model 驱动 |
| 工具 | `lib/<domain>-page/` 或 `lib/` | 纯函数、DOM 辅助、序列化 |
| 类型 | `objects/<domain>-page/` | 页面级 props、draft、步骤枚举等 |

跨域共享 hook 保留在 `hook/` 根级（如 `useDirectorTemplateLibrary.ts`）。

## 已完成拆分

| 页面 | Hook | 主要组件 |
| --- | --- | --- |
| `designer/DesignerPage/` | `hook/designer-page/*` | `component/designer-page/*` — 详见 `designer/DesignerPage/ARCHITECTURE.md` |
| `player/PlayerSocialPage/` | `usePlayerSocial` | `PlayerFriendsPanel`、`PlayerChatPanel` |
| `player/PlayerPreparationPage/` | `usePlayerPreparation` | 鸟类/弹弓面板 |
| `director/DirectorLevelInterfacePage/` | `useDirectorLevelInterface` | `DirectorLevelInterfaceToolbar`、`DirectorLevelInterfacePreviewPanel` |
| `director/DirectorPageBuilderPage/` | `useDirectorPageBuilder` | `PageBuilderWorkspace`、`PageBuilderPreviewSurface` |
| `director/DirectorButtonTemplatesPage/` | `useDirectorButtonTemplates` | `ButtonTemplateListSection`、`ButtonTemplateEditorModal` |
| `director/DirectorButtonDesignPage/` | `useDirectorButtonDesign` | `ButtonDesignWorkspace`、`ButtonDesignImageCropPanel` |
| `director/DirectorPanelCreatePage/` | `useDirectorPanelCreate` | `PanelCreateWorkspace` + 四步 `panel-create/*` |

总监构建工具共用 `lib/director-page/`、`objects/director-page/`；编辑器 UI 仍在 `component/director/` 与 `component/ui-renderer/`。

## 仍为单文件的页面（可选后续拆分）

体量适中，当前保持单文件即可；若继续增长再按上表模式拆分：

| 文件 | 约行数 | 说明 |
| --- | ---: | --- |
| `director/DirectorLevelAssignmentPage.tsx` | ~370 | 关卡分配 |
| `director/DirectorUiCustomizationPage.tsx` | ~350 | UI 定制总览 |
| `director/DirectorButtonConfigPage.tsx` | ~320 | 按钮配置 |
| `designer/DesignerBirdLabPage.tsx` | ~350 | 鸟类实验室 |
| `player/PlayerCommunityPage.tsx` | ~190 | 社区大厅 |
| `admin/AdminPage.tsx` 等 | &lt;200 | 管理列表页 |

## 已移除的遗留页

- `RoleHomePage` / `PlayerPage` — 已被 config-driven 主页 + `PageDualModeHost` 取代
- `DesignerHomePage` — 已被 `designer.home` 动态页取代
