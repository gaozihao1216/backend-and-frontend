# Frontend Page Structure

## DesignerPage Split

`DesignerPage` 已按老师的复杂页面拆分模板做最小结构调整：

- `src/frontend/pages/DesignerPage/index.tsx` 仍然是页面入口，直接展示页面整体业务结构。
- `hooks/` 放页面级共享状态和副作用，包括草稿、撤销历史、备份、地形调参和键盘快捷键辅助。
- `objects/` 放只属于 `DesignerPage` 的页面类型，例如 `DesignerBackup`、`DesignerPhase`、`DesignerPageProps`。
- `functions/` 放纯函数，例如草稿序列化、备份时间戳、深拷贝、角度归一化和地形调参清洗。
- `components/` 放业务区域组件，例如页头、关卡表单、JSON 校验、归档预览、设计手册、地形调参和编辑工作区。

跨页面、跨端共享的 API 契约仍然保留在 `src/shared/api` 和 `src/shared/schemas`。本次没有强行拆分所有简单页面，因为 `AdminPage`、`UserProfilePage`、`DesignerHomePage` 等页面规模较小，状态和渲染仍然清楚，继续保留单文件更符合“不要为了形式硬拆”的要求。
