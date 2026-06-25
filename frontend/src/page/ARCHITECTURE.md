# Frontend Page Architecture

## Directory layout

```text
page/
├── shared/          # 渲染基础设施（双模式、静态注册表、动态 Host）与共享 function/hooks
├── player/          # 玩家功能页（含 shared/ 跨页小组件）
├── admin/           # 标准管理员页
├── designer/        # 设计师页（含 DesignerLevelEditorPage/ 复杂拆分）
├── director/        # 总监控制台（含 shared/ 跨页小组件）
└── profile/         # 用户资料
```

路由入口仍在 `App.tsx`（pathname 分流）；业务页通过 `shared/StaticPageRenderer/index.tsx` 的 `pageId` 注册表挂载。

## 页面入口约定

| 形态 | 路径 | 适用 |
| --- | --- | --- |
| 目录 + `index.tsx` | `page/<domain>/<Name>Page/index.tsx` | 所有业务页：入口只负责组装 hook 与组件 |

当前不再保留顶层单文件业务页。即使页面较小，也使用目录承载 `index.tsx`、`components/`、`hooks/`、`objects/`，保持与 sample 的页面结构一致。

## 分层约定

复杂页面拆为四层（与 `designer/DesignerLevelEditorPage/` 相同）：

| 层 | 路径 | 职责 |
| --- | --- | --- |
| 页面入口 | `page/<domain>/<Name>/index.tsx` | 组装 hook + 组件，不写 API 细节 |
| Hook | `page/<domain>/<Name>/hooks/` | 状态、加载、业务 actions；导出 view model |
| 组件 | `page/<domain>/<Name>/components/` | 该页专用 UI；子流程可用 nested 子目录（如 `panel-create/`） |
| 域内共享组件 | `page/<domain>/shared/` | 同角色多页复用（如 `director/shared/TemplateCategoryFilter`、`player/shared/PageFeedback`） |
| 跨域共享组件 | `components/` | 关卡预览、App 级绑定/设置等跨页面组件 |
| 共享页面组件 | `page/shared/components/` | 动态 UI renderer 等页面运行基础设施组件 |
| 共享 Hook | `page/shared/hooks/<category>/` | 动态 UI runtime、素材加载、模板库等跨页面 hook |
| 页面函数 | `page/<domain>/<Name>/function/` | 只服务该页的纯函数、DOM 辅助、序列化 |
| 共享页面函数 | `page/shared/function/` | 动态页面配置、UI runtime、地图、背景模板、UI design 等共享页面逻辑 |
| 领域函数 | `level/function/`、`player/function/`、`system/app/` | 非页面私有的领域逻辑与应用系统逻辑 |
| 游戏引擎 | `game/engine/` | 物理引擎、战斗、鸟类技能、渲染、游戏会话 |
| 页面对象 | `page/<domain>/<Name>/objects/` | 页面级 props、draft、步骤枚举等 |
| 全局对象 | `objects/` | 后端镜像 schema、API 合同、跨页共享领域对象 |

**不再**使用 `component/<domain>-page/` 平铺目录；页面 UI 与 `page/<domain>/<Name>/` 同位存放。

跨模块复用组件放在顶层 `components/`；动态页面运行基础设施组件放在 `page/shared/components/`；不再使用旧的顶层 `component/` 目录。

## `page/shared/` 分类

```text
page/shared/
├── DynamicPageHost/index.tsx      # 动态 PageConfig 渲染宿主
├── PageDualModeHost/index.tsx     # 静态/动态双模式宿主
├── StaticPageRenderer/index.tsx   # pageId 到真实 React 页面映射
├── UiActualPagePreview/index.tsx  # PageBuilder 中的真实页面预览
├── components/
│   └── ui-renderer/               # 动态 UI renderer
├── hooks/
│   ├── level-background/          # 背景模板解析 hook
│   ├── level-map/                 # 共享地图配置 hook
│   ├── template/                  # 总监模板库 hook
│   ├── ui-runtime/                # 动态 UI runtime hook
│   └── visual-asset/              # 图片/视觉素材 hook
└── function/
    ├── ui-config/                 # 页面配置、发布、视觉资源、本地持久化
    ├── ui-runtime/                # UI 数据 key 收集、按钮状态解析
    ├── ui-design/                 # 动态文本、艺术字、图案层、图片处理
    ├── level-map/                 # 关卡地图路径、节点按钮、stage 结构
    └── level-background/          # 关卡背景模板存储与渲染解析
```

`page/shared` 只放“页面运行基础设施”。业务角色页面仍归入 `player/`、`admin/`、`designer/`、`director/`、`profile/`。

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
| `director/DirectorBirdSkillLabPage/` | `hooks/useDirectorBirdSkillLabPage` | `components/` + `function/` |
| `director/DirectorLevelBackgroundTemplatesPage/` | `hooks/useDirectorLevelBackgroundTemplatesPage` | `components/` |
| `director/DirectorLevelAssignmentPage/` | `hooks/useDirectorLevelAssignmentPage` | `components/BirdPoolConfigPanel` + `components/level/LevelPreviewCard` |
| `admin/AdminProposalReviewPage/` | `hooks/useAdminProposalReviewPage` | `components/AdminProposalReviewContent`（动态 UI widget 亦引用此路径） |
| `admin/AdminAuditLogsPage/`、`AdminCommunityPage/`、`AdminShopPage/` | 对应 `hooks/useAdmin*Page` | `components/` + `objects/` |
| `director/DirectorButtonConfigPage/`、`DirectorUiCustomizationPage/`、`DirectorWorkbenchPage/` | 对应 `hooks/useDirector*Page` | `components/` + `objects/` |
| `player/PlayerCommunityPage/`、`PlayerShopPage/` | 对应 `hooks/usePlayer*Page` | `components/` + `objects/` |
| `profile/UserProfilePage/` | `hooks/useUserProfilePage` | `components/` + `objects/` |

总监构建工具的页面私有函数与类型跟随页面放入各自 `function/`、`objects/`；动态 UI 通用渲染在 `page/shared/components/ui-renderer/`；跨页关卡预览用 `components/level/LevelPreviewCard`。

旧 `frontend/src/lib/` 已删除。跨页面逻辑必须进入明确领域目录：`system/app/`、`level/function/`、`player/function/`、`game/engine/`、`page/shared/function/` 或 `page/director/shared/function/`。

## 后续拆分准则

当前不再保留顶层单文件页面。目录页若继续增长，应优先把状态和副作用迁入同页 `hooks/`，再把列表、表单、工具栏等 JSX 迁入同页 `components/`。

## 已移除的遗留页

- `RoleHomePage` / `PlayerPage` — 已被 config-driven 主页 + `PageDualModeHost` 取代
- `DesignerHomePage` — 已被 `designer.home` 动态页取代
- `component/director-page/`、`component/player-page/`、`component/designer-page/` — 已迁入对应 `page/` 子目录
- `frontend/src/component/` — 已迁入 `page/**/components/` 与顶层 `components/`
- `frontend/src/lib/` — 已按领域迁入 `system/app/`、`level/function/`、`player/function/`、`game/engine/`、`page/shared/function/`、`page/director/shared/function/`
