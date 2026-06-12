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

## 分层约定

与 `designer/DesignerPage/` 相同，复杂页面拆为：

| 层 | 路径 | 职责 |
| --- | --- | --- |
| 页面入口 | `page/<domain>/<Name>/index.tsx` 或 `<Name>Page.tsx` | 组装 hook + 组件，不写 API 细节 |
| Hook | `hook/<domain>-page/` | 状态、加载、业务 actions |
| 组件 | `component/<domain>-page/` | 纯展示，props 驱动 |
| 工具 | `lib/` | 纯函数 |

已拆分示例：

- `designer/DesignerPage/` — 见 `designer/DesignerPage/ARCHITECTURE.md`
- `player/PlayerSocialPage/` — `usePlayerSocial` + 好友/聊天面板
- `player/PlayerPreparationPage/` — `usePlayerPreparation` + 鸟类/弹弓面板
- `director/DirectorLevelInterfacePage/` — `useDirectorLevelInterface` + 工具栏/预览面板
- `director/DirectorPageBuilderPage/` — `useDirectorPageBuilder` + `PageBuilderWorkspace` + `PageBuilderPreviewSurface`
- `director/DirectorButtonTemplatesPage/` — `useDirectorButtonTemplates` + 列表/编辑器模态
- `director/DirectorButtonDesignPage/` — `useDirectorButtonDesign` + 图案截取/预览组件
- `director/DirectorPanelCreatePage/` — `useDirectorPanelCreate` + `PanelCreateWorkspace` + 四步面板编辑器

## 待拆分（按优先级）

| 文件 | 行数 | 建议 |
| --- | ---: | --- |
| `director/DirectorButtonDesignPage/` | ~1100 | ✅ 已拆 |
| `director/DirectorLevelInterfacePage/` | ~460 | ✅ 已拆 |
| `director/DirectorPageBuilderPage/` | ~1700 | ✅ 已拆 |
| `director/DirectorButtonTemplatesPage/` | ~780 | ✅ 已拆 |

总监页已复用 `component/director/` 中的编辑器；复杂页面 state 迁入 `hook/director-page/`。

## 已移除的遗留页

- `RoleHomePage` / `PlayerPage` — 已被 config-driven 主页 + `PageDualModeHost` 取代
- `DesignerHomePage` — 已被 `designer.home` 动态页取代
