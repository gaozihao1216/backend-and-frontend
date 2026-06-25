import { PageBuilderTextObjectEditor } from "./PageBuilderTextObjectEditor.js";
import { DynamicPageRenderer } from "../../../shared/components/ui-renderer/index.js";
import { PageBuilderPreview } from "./PageBuilderPreviewSurface.js";
import { isStaticPageSupported } from "../../../shared/StaticPageRenderer/index.js";
import { UiActualPagePreview } from "../../../shared/UiActualPagePreview/index.js";
import type { DirectorPageBuilderState } from "../hooks/useDirectorPageBuilder.js";
import {
  canUseAsWorkingPanel,
  getAllChildPanels,
  getComponentLabel,
  getComponentTypeLabel,
  getParentPanelId,
  handleInlineScrollWheel,
} from "../function/page-builder-helpers.js";

type PageBuilderWorkspaceProps = DirectorPageBuilderState & {
  onBack: () => void;
  onNavigate: (nextPath: string) => void;
};

export const PageBuilderWorkspace = ({
  pageId,
  targetPath,
  pageConfig,
  panelPickerOpen,
  setPanelPickerOpen,
  pickerPanelId,
  setPickerPanelId,
  showPanelOutlines,
  setShowPanelOutlines,
  showButtonOutlines,
  setShowButtonOutlines,
  showTextOutlines,
  setShowTextOutlines,
  openPanelIds,
  editingTextComponentId,
  feedback,
  builderSurfaceMode,
  setBuilderSurfaceMode,
  previewUser,
  componentMap,
  controlledPanelIds,
  rootPanel,
  normalizedWorkingPanel,
  normalizedPickerPanel,
  outlinedComponentIds,
  normalizedPendingComponentId,
  normalizedSelectedComponentId,
  activeComponent,
  addComponentToWorkingPanel,
  deleteWorkingPanel,
  handleSave,
  handlePublish,
  handleRollback,
  publishState,
  openButtonDesign,
  openButtonConfig,
  openPanelCreate,
  setActivePanelAsWorkingPanel,
  togglePreviewPanel,
  selectPreviewObject,
  clearPreviewObjectSelection,
  startTextEditing,
  updateTextComponent,
  updateTextComponentContent,
  endTextEditing,
  moveSelectedPreviewObject,
  resizeSelectedPreviewObject,
  setWorkingPanelId,
  onBack,
  onNavigate,
}: PageBuilderWorkspaceProps) => (
  <section className="page-builder-shell">
    <div className="page-builder-toolbar">
      <div>
        <p className="eyebrow">Page Builder</p>
        <h2>页面可视化编辑器</h2>
        <p className="panel-copy">可在编辑画布、静态页面、动态嵌套与并排对比之间切换，检查 UI 差异。</p>
      </div>
      <div className="actions">
        <button type="button" className="secondary" onClick={onBack}>
          返回 UI 美化配置
        </button>
        <button type="button" disabled={!pageConfig} onClick={handleSave}>
          保存草稿
        </button>
        <button type="button" disabled={!pageConfig || publishState === "working"} onClick={() => void handlePublish()}>
          发布到玩家端
        </button>
        <button type="button" className="secondary" disabled={!pageId || publishState === "working"} onClick={() => void handleRollback()}>
          回滚上一版
        </button>
      </div>
    </div>

    {!pageId ? (
      <p className="feedback error">缺少 pageId，无法进入页面优化。</p>
    ) : null}
    {pageId && !pageConfig ? (
      <p className="feedback error">该页面还没有动态页面配置，无法优化。</p>
    ) : null}

    {pageConfig ? (
      <div className="page-builder-layout">
        <div className="page-builder-preview-meta">
          <div>
            <span>预览页面</span>
            <strong>{pageConfig.name}</strong>
            <code>{pageConfig.path}</code>
          </div>
          {previewUser ? (
            <div>
              <span>测试账号</span>
              <strong>{previewUser.nickname}</strong>
              <code>
                {previewUser.roleLabel} · {previewUser.apiUserId}
              </code>
            </div>
          ) : null}
        </div>
        <section className="page-builder-canvas-panel">
          <div className="page-builder-editor-actions">
            <span>配置工具</span>
            {feedback ? <span>{feedback}</span> : null}
          </div>
          <div className="page-builder-tool-strip">
            <section>
              <h3>工作面板</h3>
              <div className="page-builder-current-panel">
                <span>请选择你所工作的面板</span>
                <div>
                  <code>{normalizedWorkingPanel ? getComponentLabel(normalizedWorkingPanel) : "未选择"}</code>
                  <button type="button" className="secondary" onClick={() => {
                    setPickerPanelId(normalizedWorkingPanel?.id ?? rootPanel?.id ?? null);
                    setPanelPickerOpen(true);
                  }}>
                    修改
                  </button>
                </div>
              </div>
            </section>

            <section>
              <h3>配置</h3>
              <label className="page-builder-check-row">
                <input
                  type="checkbox"
                  checked={showPanelOutlines}
                  onChange={(event) => setShowPanelOutlines(event.target.checked)}
                />
                <span>显示所有子面板的轮廓</span>
              </label>
              <label className="page-builder-check-row">
                <input
                  type="checkbox"
                  checked={showButtonOutlines}
                  onChange={(event) => setShowButtonOutlines(event.target.checked)}
                />
                <span>显示所有按钮的轮廓</span>
              </label>
              <label className="page-builder-check-row">
                <input
                  type="checkbox"
                  checked={showTextOutlines}
                  onChange={(event) => setShowTextOutlines(event.target.checked)}
                />
                <span>显示所有文本框的轮廓</span>
              </label>
            </section>

            <section>
              <h3>基础操作</h3>
              <div className="page-builder-tool-buttons">
                <button type="button" onClick={() => addComponentToWorkingPanel("button")}>
                  添加新按钮
                </button>
                <button type="button" onClick={() => addComponentToWorkingPanel("panel")}>
                  添加新子面板
                </button>
                <button type="button" className="secondary" onClick={openPanelCreate}>
                  创建小面板
                </button>
                <button type="button" onClick={() => addComponentToWorkingPanel("text")}>
                  新建文本框
                </button>
                <button
                  type="button"
                  className="secondary"
                  disabled={!normalizedWorkingPanel || normalizedWorkingPanel.id === rootPanel?.id}
                  onClick={deleteWorkingPanel}
                >
                  删除
                </button>
                {activeComponent?.type === "button" ? (
                  <button type="button" className="page-builder-button-design-action" onClick={openButtonDesign}>
                    按钮美化
                  </button>
                ) : null}
                {activeComponent?.type === "button" ? (
                  <button type="button" className="secondary page-builder-button-config-action" onClick={openButtonConfig}>
                    按钮配置
                  </button>
                ) : null}
                {canUseAsWorkingPanel(activeComponent) && activeComponent.id !== normalizedWorkingPanel?.id ? (
                  <button
                    type="button"
                    className="secondary page-builder-set-working-panel-action"
                    onClick={setActivePanelAsWorkingPanel}
                  >
                    设为工作面板
                  </button>
                ) : null}
              </div>
            </section>
          </div>
          <section className="page-builder-selected-object-panel">
            <div>
              <h3>选中对象</h3>
              {activeComponent ? (
                <span>{getComponentTypeLabel(activeComponent)}</span>
              ) : (
                <span>未选中</span>
              )}
            </div>
            <div className="page-builder-selected-object-grid">
              <label>
                <span>名称</span>
                <code onWheel={handleInlineScrollWheel}>{activeComponent ? getComponentLabel(activeComponent) : "-"}</code>
              </label>
              <label>
                <span>类型</span>
                <code onWheel={handleInlineScrollWheel}>{activeComponent ? getComponentTypeLabel(activeComponent) : "-"}</code>
              </label>
              <label>
                <span>位置</span>
                <code onWheel={handleInlineScrollWheel}>
                  {activeComponent
                    ? `${activeComponent.position.x.toFixed(2)}, ${activeComponent.position.y.toFixed(2)}`
                    : "-"}
                </code>
              </label>
              <label>
                <span>宽</span>
                <code onWheel={handleInlineScrollWheel}>{activeComponent ? activeComponent.position.width.toFixed(2) : "-"}</code>
              </label>
              <label>
                <span>高</span>
                <code onWheel={handleInlineScrollWheel}>{activeComponent ? activeComponent.position.height.toFixed(2) : "-"}</code>
              </label>
            </div>
            {activeComponent?.type === "text" && previewUser ? (
              <PageBuilderTextObjectEditor
                component={activeComponent}
                pageRoleScope={pageConfig.roleScope}
                previewUser={previewUser}
                onChange={(nextComponent) => updateTextComponent(activeComponent.id, () => nextComponent)}
              />
            ) : null}
          </section>
          <div className="page-builder-render-surface page-builder-actual-preview-surface">
            <div className="page-builder-surface-toggle" role="tablist" aria-label="页面预览模式">
              {([
                ["editor", "编辑画布"],
                ["static", "静态页面"],
                ["dynamic", "动态嵌套"],
                ["compare", "并排对比"],
              ] as const).map(([mode, label]) => (
                <button
                  key={mode}
                  type="button"
                  role="tab"
                  aria-selected={builderSurfaceMode === mode}
                  className={builderSurfaceMode === mode ? "active" : "secondary"}
                  disabled={mode === "static" && pageConfig ? !isStaticPageSupported(pageConfig.id) : false}
                  onClick={() => setBuilderSurfaceMode(mode)}
                >
                  {label}
                </button>
              ))}
            </div>
            {builderSurfaceMode === "editor" && previewUser ? (
              <div className="page-builder-dynamic-page-frame">
                <PageBuilderPreview
                  pageConfig={pageConfig}
                  controlledPanelIds={controlledPanelIds}
                  openPanelIds={openPanelIds}
                  previewUser={previewUser}
                  outlinedComponentIds={outlinedComponentIds}
                  pendingComponentId={normalizedPendingComponentId}
                  selectedComponentId={normalizedSelectedComponentId}
                  editingTextComponentId={editingTextComponentId}
                  onTogglePanel={togglePreviewPanel}
                  onOutlineClick={selectPreviewObject}
                  onOutlineMiss={clearPreviewObjectSelection}
                  onStartTextEditing={startTextEditing}
                  onMoveSelectedComponent={moveSelectedPreviewObject}
                  onResizeSelectedComponent={resizeSelectedPreviewObject}
                  onTextChange={updateTextComponentContent}
                  onTextEditEnd={endTextEditing}
                />
              </div>
            ) : null}
            {builderSurfaceMode === "static" && previewUser ? (
              <UiActualPagePreview page={pageConfig} previewUser={previewUser} pathname={targetPath} onNavigate={onNavigate} />
            ) : null}
            {builderSurfaceMode === "dynamic" && previewUser ? (
              <div className="page-builder-dynamic-page-frame">
                <DynamicPageRenderer page={pageConfig} previewUser={previewUser} onNavigate={onNavigate} />
              </div>
            ) : null}
            {builderSurfaceMode === "compare" && previewUser ? (
              <div className="page-builder-compare-surface">
                <div className="page-dual-mode-pane page-dual-mode-pane-static">
                  <p className="page-dual-mode-pane-label">静态页面</p>
                  <UiActualPagePreview page={pageConfig} previewUser={previewUser} pathname={targetPath} onNavigate={onNavigate} />
                </div>
                <div className="page-dual-mode-pane page-dual-mode-pane-dynamic">
                  <p className="page-dual-mode-pane-label">动态嵌套</p>
                  <DynamicPageRenderer page={pageConfig} previewUser={previewUser} onNavigate={onNavigate} />
                </div>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    ) : null}

    {panelPickerOpen && pageConfig && normalizedPickerPanel ? (
      <div className="page-builder-dialog-backdrop" role="presentation">
        <section className="page-builder-dialog" role="dialog" aria-modal="true" aria-label="查找当前面板">
          <div className="page-builder-dialog-header">
            <div>
              <p className="eyebrow">Panel Finder</p>
              <h3>查找当前面板</h3>
            </div>
            <button type="button" className="secondary" onClick={() => setPanelPickerOpen(false)}>
              关闭
            </button>
          </div>
          <div className="page-builder-dialog-path">
            <span>当前位置</span>
            <code>{normalizedPickerPanel.id}</code>
          </div>
          <div className="page-builder-dialog-actions">
            <button
              type="button"
              className="secondary"
              disabled={!getParentPanelId(pageConfig, normalizedPickerPanel.id)}
              onClick={() => setPickerPanelId(getParentPanelId(pageConfig, normalizedPickerPanel.id))}
            >
              返回上一级
            </button>
            <button
              type="button"
              disabled={!canUseAsWorkingPanel(normalizedPickerPanel)}
              onClick={() => {
                if (!canUseAsWorkingPanel(normalizedPickerPanel)) {
                  return;
                }
                setWorkingPanelId(normalizedPickerPanel.id);
                setPanelPickerOpen(false);
              }}
            >
              选择此面板
            </button>
          </div>
          <div className="page-builder-directory-list">
            {getAllChildPanels(normalizedPickerPanel, componentMap)
              .filter(canUseAsWorkingPanel)
              .map((child) => {
              return (
                <button
                  key={child.id}
                  type="button"
                  onClick={() => setPickerPanelId(child.id)}
                >
                  <span>目录</span>
                  <strong>{getComponentLabel(child)}</strong>
                  <code>{child.id}</code>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    ) : null}
  </section>
);
