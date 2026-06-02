# DesignerPage Architecture

## 1. 重构目标

`DesignerPage/index.tsx` 原先承担了过多职责：draft 表单状态、`levelData` 与 JSON 同步、undo/redo、备份、创建/提交、键盘快捷键、地面编辑、旋转逻辑，以及大量 JSX 面板组合。随着设计器功能增加，页面文件变得难以 review，也很难判断某次修改是否影响了编辑器核心行为。

这轮重构的目标是把 DesignerPage 拆成三层：

- `index.tsx`：页面协调层，负责把各个领域 hook 和展示组件组装起来。
- `hooks/`：领域状态与业务 actions，例如 level data、keyboard、ground、rotation、backup、submission。
- `components/`：纯展示或透传组件，主要负责 JSX 结构、布局和按钮绑定。

配套还补了测试和 CI，保证 API proxy、auth route、store 隔离、类型检查、测试和 build 都能在后续改动中被持续验证。

## 2. 当前整体结构

```text
DesignerPage/index.tsx
  ├─ 初始化 hooks
  ├─ 页面 mode routing
  ├─ restoreDraft / restoreDraftAndClearHistory
  ├─ switchDesignerPhase
  ├─ handleDeleteSelected
  ├─ useDesignerKeyboardShortcuts 注册编排
  └─ JSX composition

hooks/
  ├─ useDesignerDraft
  ├─ useDesignerFeedback
  ├─ useDesignerLevelDataController
  ├─ useDesignerLevelSubmission
  ├─ useDesignerBackups
  ├─ useDesignerBackupActions
  ├─ useDesignerKeyboardActions
  ├─ useDesignerGroundActions
  ├─ useDesignerRotationActions
  ├─ useDesignerEditor
  ├─ useDesignerGroundEditor
  ├─ useDesignerGroundTuning
  └─ useDesignerKeyboardShortcuts

components/
  ├─ DesignerHeader
  ├─ LevelFormPanel
  ├─ DesignerEntityControls
  ├─ DesignerGridControls
  ├─ DesignerActionBar
  ├─ DesignerCanvasPanel
  ├─ DesignerBackupPanel
  ├─ DraftPreviewPanel
  ├─ DesignerCreateActions
  ├─ CreatedLevelsPanel
  ├─ GroundEditorToggleControls
  ├─ CeilingControls
  ├─ GroundPointControls
  ├─ VoidSpanControls
  ├─ ArchivePanel
  ├─ JsonCheckPanel
  ├─ SettingsPage
  ├─ DesignBookPage
  ├─ DesignBookPanel
  ├─ GroundTuningPanel
  └─ DesignerWorkspace
```

## 3. Hooks 职责说明

### useDesignerDraft

负责：

- `title`
- `description`
- `selectedTags`
- `toggleTag`

不负责：

- `levelData`
- JSON 文本与 JSON 错误
- `message` / `error`
- create / submit API

### useDesignerFeedback

负责页面通用反馈状态：

- `message`
- `error`

这些状态被 create、submit、backup、restore 等流程共享，因此单独从 draft metadata 中拆出。

### useDesignerLevelDataController

负责：

- `levelData`
- `jsonText`
- `jsonError`
- `applyLevelDataUpdate`
- `setLevelDataAndSyncJson`
- `undoHistory` / `redoHistory`
- `handleUndo` / `handleRedo`
- `tryApplyJsonText`
- `handleJsonTextChange`
- `clearHistory`

所有会改变 `levelData` 的业务逻辑都应该通过 `applyLevelDataUpdate`，这样 JSON 同步、undo push、redo clear 的行为保持一致。直接替换整份草稿时使用 `setLevelDataAndSyncJson`，selection reset 与 history clear 仍由页面协调层决定。

### useDesignerLevelSubmission

负责：

- `createdLevels`
- `submittedIds`
- `handleCreate`
- `handleSubmit`

这个 hook 把 `createLevel` / `submitLevel` API 逻辑从页面中移出，但不拥有 title、description、tags、levelData、userId 或 message/error。它们通过参数传入，职责边界保持在“创建/提交动作”。

### useDesignerBackups

负责：

- localStorage persistence
- `designerBackups` state

这是较底层的备份持久化 hook，不直接决定页面如何恢复草稿。

### useDesignerBackupActions

负责：

- `handleCreateBackup`
- `handleRestoreBackup`

`restoreDraftAndClearHistory` 仍由 `index.tsx` 传入，因为恢复草稿会跨 draft metadata、levelData/JSON sync、history clear、editor selection reset 和 ground selection reset。

### useDesignerKeyboardActions

负责具体 shortcut handler：

- `handleUndoShortcut`
- `handleRedoShortcut`
- `handleCopyShortcut`
- `handlePasteShortcut`
- `handleCutShortcut`
- `handleDeleteShortcut`

`useDesignerKeyboardShortcuts` 的注册编排仍留在 `index.tsx`，这样 editable target 过滤、快捷键调用顺序、Alt key handling 都能在页面层清楚看到。Delete 的优先级仍是 Ground Delete 先于 Entity Delete。

### useDesignerGroundActions

负责地面编辑 actions：

- `handleTerrainEditModeChange`
- `handleToggleGroundEditor`
- `handleTerrainBoundaryTypeChange`
- `handleCreateCeilingBoundary`
- `handleDeleteCeilingBoundary`
- `handleGenerateGroundFromCeiling`
- `handleMoveGroundPointForward`
- `handleMoveGroundPointBackward`
- `handleRemoveGroundPoint`
- `handleRemoveVoidSpan`

ground 的具体业务 action 已迁出 `index.tsx`。`switchDesignerPhase` 仍保留在页面层，因为它同时协调 editor、groundEditor、activeTool、selection reset 和 ground editor enabled。

### useDesignerRotationActions

负责：

- `handleRotationAngleChange`

单选 obstacle rotation 和多选 group rotation 都在这里处理。`DesignerEntityControls` 只负责展示和透传 `onRotationAngleChange`，不处理旋转业务。

### useDesignerEditor / useDesignerGroundEditor / useDesignerGroundTuning

- `useDesignerEditor` 负责实体编辑器状态，例如 active tool、selection、clipboard、canvas pointer、grid、group selection。
- `useDesignerGroundEditor` 负责 ground editor 派生状态，例如当前 terrain、active boundary、selected point、selected void span、designer phase。
- `useDesignerGroundTuning` 负责地面绘制和材质相关 tuning 参数，主要被 SettingsPage 和 canvas 使用。

## 4. Components 职责说明

展示组件的基本原则：

- 不持有业务 state。
- 不直接修改 `levelData`。
- 通过 props 接收数据和 callbacks。
- 主要负责 JSX 结构、UI 展示和按钮绑定。

### DesignerEntityControls

包含：

- `EditorToolbar`
- 粗调 `RotationKnob`
- 微调 `RotationKnob`
- rotation angle readout

不负责：

- group rotation 计算
- selected obstacle update
- `applyLevelDataUpdate`

### Ground controls 子组件

包括：

- `GroundEditorToggleControls`
- `CeilingControls`
- `GroundPointControls`
- `VoidSpanControls`

它们负责 UI 展示和按钮绑定，具体地面业务逻辑在 `useDesignerGroundActions`。

### DesignerCanvasPanel

负责组合：

- `DesignerWorkspace`
- `LevelEditorCanvas`
- `SelectedEntityPanel`

它是纯展示/透传面板，`LevelEditorCanvas` 的数据和回调仍由 `index.tsx` 组装后传入。

### 其它面板

- `DesignerActionBar`：Undo、Redo、保存备份、删除选中对象、打开 JSON 检查。
- `DesignerGridControls`：网格间距控制。
- `DesignerBackupPanel`：备份列表入口与恢复按钮。
- `DraftPreviewPanel`：当前草稿预览。
- `DesignerCreateActions`：创建关卡按钮。
- `CreatedLevelsPanel`：本 session 创建的关卡列表与提交入口。
- `ArchivePanel`：备份归档查看与恢复。
- `JsonCheckPanel`：当前草稿或备份 JSON 查看/编辑。
- `SettingsPage`：设计器参数设置页。
- `DesignBookPage` / `DesignBookPanel`：设计说明内容。

## 5. 为什么这些逻辑仍留在 index.tsx

### restoreDraft / restoreDraftAndClearHistory

恢复草稿跨多个领域：

- draft metadata
- `levelData` / JSON sync
- history clear
- editor selection reset
- ground selection reset

如果强行迁入某个 hook，会让该 hook 依赖其它领域状态，边界变差。

### switchDesignerPhase

切换设计阶段跨：

- editor state
- groundEditor state
- activeTool
- selection reset
- ground editor enabled

它属于页面协调动作，留在 `index.tsx` 更清晰。

### mode routing

`archive`、`archive_json_check`、`json_check`、`settings`、`design_book`、`design` 是页面入口模式。它们决定当前页面返回哪个顶层 view，因此保留在页面层。

### keyboard registration

注册逻辑需要清楚保留：

- editable target 过滤
- shortcut 调用顺序
- Alt key handling

具体 shortcut handler 已迁入 `useDesignerKeyboardActions`，但注册编排仍由 `index.tsx` 负责。

### handleDeleteSelected

它同时服务 UI action bar 和 keyboard delete callback，并且依赖当前 editor selection 与 `applyLevelDataUpdate`。保留在页面层可以避免 keyboard hook 直接拥有 UI 删除语义。

## 6. Auth / API / Store / CI 稳定性补充

本轮 DesignerPage 重构之外，还做了项目稳定性建设：

- 修复 `/auth` dev proxy，避免 `/auth/bind` 在 Vite dev server 上返回 404。
- 新增 API proxy coverage test，防止前端新增 API path 时漏配 Vite proxy。
- 新增 auth route handler test，覆盖 `/auth/backend-users` 和 `/auth/bind`。
- 修复 `lifecycle.test.ts` store 隔离问题。
- 将 `data/backend-store.json` 保留为 tracked seed/demo 数据。
- 将 `data/backend-store.local.json` 作为本地 runtime store，并加入 `.gitignore`。
- 新增 GitHub Actions CI：
  - `npm ci`
  - `npm run check`
  - `npm test`
  - `npm run build`

## 7. Code Review 讲解顺序建议

建议现场讲解顺序：

1. 先讲原问题：`DesignerPage/index.tsx` 同时承担状态、业务动作、键盘、地面、旋转、备份、提交和大量 JSX。
2. 再讲现在的三层结构：
   - `index.tsx` 页面协调层
   - hooks 业务状态和 actions
   - components 纯展示
3. 重点讲四个关键 hook：
   - `useDesignerLevelDataController`
   - `useDesignerKeyboardActions`
   - `useDesignerGroundActions`
   - `useDesignerRotationActions`
4. 说明为什么 `restoreDraft`、`switchDesignerPhase`、mode routing、keyboard registration 没继续抽。
5. 最后讲测试和 CI 保护：proxy coverage、auth route test、store 隔离、GitHub Actions。

## 8. 后续不建议继续强拆的点

- 不建议抽 `useDesignerPage`。它大概率会变成把所有依赖重新塞到一起的 God Hook。
- 不建议继续迁移 `restoreDraft`，因为它天然跨多个领域。
- 不建议继续迁移 `switchDesignerPhase`，因为它是页面阶段协调动作。
- 不建议为了缩短文件继续拆 mode routing，顶层 mode 本来就是页面职责。
- 不建议继续围绕旧 point/stroke endpoint inference 做地形边界优化；Terrain Boundary V2 应作为后续独立设计。
