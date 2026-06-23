import {
  createDefaultChainEdges,
  formatLevelMapEdgeLabel,
  getLevelSuffixLabel,
  LEVEL_MAP_PATH_EDGE_STYLE_META,
  removeLevelMapPathEdge,
  updateLevelMapPathEdge,
} from "../../../../lib/level-map-path.js";
import type { LevelMapPathDesign, LevelMapPathEdge } from "../../../../objects/ui-customization/ui-customization-objects.js";

type LevelMapPathEditorProps = {
  pathDesign: LevelMapPathDesign;
  onChange: (pathDesign: LevelMapPathDesign) => void;
  selectedEdgeId: string | null;
  onSelectedEdgeIdChange: (edgeId: string | null) => void;
  connectFromSuffix: string | null;
  onConnectFromSuffixChange: (suffix: string | null) => void;
  onSave: () => void;
  onClose: () => void;
  saveMessage: string;
  saveError: string;
  saving?: boolean;
};

export const LevelMapPathEditor = ({
  pathDesign,
  onChange,
  selectedEdgeId,
  onSelectedEdgeIdChange,
  connectFromSuffix,
  onConnectFromSuffixChange,
  onSave,
  onClose,
  saveMessage,
  saveError,
  saving = false,
}: LevelMapPathEditorProps) => {
  const selectedEdge = pathDesign.edges.find((edge: LevelMapPathEdge) => edge.id === selectedEdgeId) ?? null;

  return (
    <section className="level-interface-path-editor panel-create-form">
      <div className="level-interface-background-editor-header">
        <div>
          <h3>路径设置</h3>
          <p className="panel-copy">
            连接相邻关卡节点。路径会随按钮位置自动对齐，并随玩家进度切换显示状态。
          </p>
        </div>
        <button type="button" className="secondary" onClick={onClose}>
          关闭
        </button>
      </div>

      <div className="level-interface-path-editor-actions">
        <button
          type="button"
          className={connectFromSuffix ? "active" : "secondary"}
          onClick={() => {
            if (connectFromSuffix !== null) {
              onConnectFromSuffixChange(null);
              return;
            }
            onConnectFromSuffixChange("");
          }}
        >
          {connectFromSuffix ? "取消连接" : "添加连接"}
        </button>
        <button
          type="button"
          className="secondary"
          onClick={() => {
            onChange({ edges: createDefaultChainEdges() });
            onSelectedEdgeIdChange(null);
            onConnectFromSuffixChange(null);
          }}
        >
          恢复默认链条
        </button>
      </div>

      {connectFromSuffix !== null ? (
        <p className="level-interface-path-connect-hint panel-copy">
          {connectFromSuffix
            ? `已选起点：${getLevelSuffixLabel(connectFromSuffix)}。请在预览中点击目标关卡。`
            : "请在预览中点击起点关卡，再点击目标关卡完成连接。"}
        </p>
      ) : null}

      {selectedEdge ? (
        <div className="level-interface-path-edge-panel">
          <strong>{formatLevelMapEdgeLabel(selectedEdge)}</strong>
          <label className="level-interface-path-style-field">
            <span>路径样式</span>
            <select
              value={selectedEdge.style?.templateId ?? "plank"}
              onChange={(event) => {
                onChange(updateLevelMapPathEdge(pathDesign, selectedEdge.id, {
                  style: {
                    templateId: event.target.value as NonNullable<typeof selectedEdge.style>["templateId"],
                    ...(selectedEdge.style?.width ? { width: selectedEdge.style.width } : {}),
                  },
                }));
              }}
            >
              {LEVEL_MAP_PATH_EDGE_STYLE_META.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="secondary"
            onClick={() => {
              onChange(removeLevelMapPathEdge(pathDesign, selectedEdge.id));
              onSelectedEdgeIdChange(null);
            }}
          >
            删除此连接
          </button>
        </div>
      ) : null}

      <div className="level-interface-path-edge-list">
        <h4>当前连接 ({pathDesign.edges.length})</h4>
        {pathDesign.edges.length === 0 ? (
          <p className="panel-copy">暂无路径连接。可点击「添加连接」或「恢复默认链条」。</p>
        ) : (
          <ul>
            {pathDesign.edges.map((edge: LevelMapPathEdge) => (
              <li key={edge.id}>
                <button
                  type="button"
                  className={selectedEdgeId === edge.id ? "active" : "secondary"}
                  onClick={() => onSelectedEdgeIdChange(edge.id)}
                >
                  {formatLevelMapEdgeLabel(edge)}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="level-interface-background-editor-actions">
        <button type="button" onClick={onSave} disabled={saving}>
          {saving ? "保存中..." : "保存路径"}
        </button>
      </div>

      {saveMessage ? <p className="feedback success">{saveMessage}</p> : null}
      {saveError ? <p className="feedback error">{saveError}</p> : null}
    </section>
  );
};
