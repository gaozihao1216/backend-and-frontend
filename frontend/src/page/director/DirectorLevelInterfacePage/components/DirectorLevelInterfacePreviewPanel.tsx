import { LevelMapLayoutPreview } from "./LevelMapLayoutPreview.js";
import type { LevelMapPathEditContext } from "../../../../component/ui-renderer/ui-renderer-types.js";
import {
  LEVEL_NODE_PROGRESS_STATE_META,
  type LevelNodeProgressStateId,
} from "../../../../lib/level-node-button-format.js";
import { LEVEL_NODE_DEFINITIONS } from "../../../../objects/ui-customization/level-map-structure.js";
import type { ComponentPosition, PageConfig, UiPreviewUser } from "../../../../objects/ui-customization/ui-customization-objects.js";
import type { LevelInterfaceEditor } from "../../../../objects/director-page/level-interface-types.js";

type DirectorLevelInterfacePreviewPanelProps = {
  previewPageConfig: PageConfig;
  previewUser: UiPreviewUser;
  previewUiData: Record<string, unknown>;
  levelNodeCount: number;
  activeEditor: LevelInterfaceEditor;
  previewState: LevelNodeProgressStateId;
  onPreviewStateChange: (state: LevelNodeProgressStateId) => void;
  previewLevelSuffix: string;
  onPreviewLevelSuffixChange: (suffix: string) => void;
  selectedLevelSuffix: string | null;
  onSelectedLevelSuffixChange: (suffix: string | null) => void;
  onLevelButtonPositionChange: (levelSuffix: string, position: ComponentPosition) => void;
  pathEdit: LevelMapPathEditContext | undefined;
  savingLayout: boolean;
  onSaveLayout: () => void;
  saveMessage: string;
  saveError: string;
};

export const DirectorLevelInterfacePreviewPanel = ({
  previewPageConfig,
  previewUser,
  previewUiData,
  levelNodeCount,
  activeEditor,
  previewState,
  onPreviewStateChange,
  previewLevelSuffix,
  onPreviewLevelSuffixChange,
  selectedLevelSuffix,
  onSelectedLevelSuffixChange,
  onLevelButtonPositionChange,
  pathEdit,
  savingLayout,
  onSaveLayout,
  saveMessage,
  saveError,
}: DirectorLevelInterfacePreviewPanelProps) => (
  <>
    <div className="page-builder-preview-meta">
      <div>
        <span>共享地图</span>
        <strong>{previewPageConfig.name}</strong>
        <code>{previewPageConfig.id}</code>
      </div>
      <div>
        <span>关卡节点</span>
        <strong>{levelNodeCount} 个</strong>
        <code>三态文案：未解锁 / 未通关 / 已通关</code>
      </div>
    </div>

      <section className="page-builder-canvas-panel level-interface-preview-panel">
        <div className="page-builder-editor-actions level-interface-preview-actions">
          <div className="level-interface-preview-actions-main">
            <span>关卡路径地图预览</span>
            <span>测试账号 {previewUser.nickname}</span>
          </div>
          <div className="level-interface-preview-actions-controls">
            <button type="button" onClick={onSaveLayout} disabled={savingLayout}>
              {savingLayout ? "保存中..." : "保存按钮布局"}
            </button>
          </div>
        </div>
        <div className="level-interface-preview-state-controls">
          <span>预览样式</span>
          <div className="level-interface-button-format-preview-tabs">
            {LEVEL_NODE_PROGRESS_STATE_META.map((state) => (
              <button
                key={state.id}
                type="button"
                className={previewState === state.id ? "active" : "secondary"}
                onClick={() => onPreviewStateChange(state.id)}
              >
                {state.name}
              </button>
            ))}
          </div>
          <label className="level-interface-preview-level-select">
            <span>示例关卡</span>
            <select
              value={previewLevelSuffix}
              onChange={(event) => onPreviewLevelSuffixChange(event.target.value)}
            >
              {LEVEL_NODE_DEFINITIONS.map((level) => (
                <option key={level.suffix} value={level.suffix}>
                  {level.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="level-interface-layout-hint panel-copy">
          {activeEditor === "pathDesign"
            ? "路径编辑模式：点击路径选中连接，或使用「添加连接」在预览中依次点击两个关卡节点。"
            : "预览会显示当前背景、路径与按钮样式。点击节点选中后可拖动调整位置，四角可调整大小；不会跳转到关卡页面。"}
        </p>
        {saveMessage ? <p className="feedback success">{saveMessage}</p> : null}
        {saveError ? <p className="feedback error">{saveError}</p> : null}
        <div className="page-builder-render-surface page-builder-actual-preview-surface level-interface-map-preview-surface">
          <div className="page-builder-dynamic-page-frame">
            <LevelMapLayoutPreview
              page={previewPageConfig}
              previewUser={previewUser}
              previewUiData={previewUiData}
              selectedLevelSuffix={selectedLevelSuffix}
              onSelectedLevelSuffixChange={onSelectedLevelSuffixChange}
              onLevelButtonPositionChange={onLevelButtonPositionChange}
              pathEdit={pathEdit}
            />
          </div>
        </div>
      </section>
  </>
);
