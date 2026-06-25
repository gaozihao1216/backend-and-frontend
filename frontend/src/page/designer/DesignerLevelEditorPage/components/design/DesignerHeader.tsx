import type { DesignerPhase } from "../../objects/designer-level-editor-page-types.js";

type DesignerHeaderProps = {
  designerPhase: DesignerPhase;
  onBack?: (() => void) | undefined;
  onOpenSettingsPage?: (() => void) | undefined;
  onOpenDesignBook?: (() => void) | undefined;
  onPhaseChange: (nextPhase: DesignerPhase) => void;
};

export const DesignerHeader = ({
  designerPhase,
  onBack,
  onOpenSettingsPage,
  onOpenDesignBook,
  onPhaseChange,
}: DesignerHeaderProps) => (
  <>
    {onBack ? (
      <div className="actions">
        <button type="button" className="secondary" onClick={onBack}>
          返回设计师主页
        </button>
      </div>
    ) : null}
    <h2>Designer</h2>
    <p className="panel-copy">Create a simple level payload and submit it for admin review.</p>
    <div className="designer-phase-panel">
      <div className="card-header">
        <strong>设计阶段</strong>
        <span>{designerPhase === "ground" ? "第一阶段：创造地面" : "第二阶段：构建物体"}</span>
      </div>
      <div className="actions">
        <button type="button" className="secondary" onClick={onOpenSettingsPage}>
          设置
        </button>
        <button type="button" className="secondary" onClick={onOpenDesignBook}>
          设计指导
        </button>
        <button
          type="button"
          className={designerPhase === "ground" ? "" : "secondary"}
          onClick={() => onPhaseChange("ground")}
        >
          第一阶段：创造地面
        </button>
        <button
          type="button"
          className={designerPhase === "entities" ? "" : "secondary"}
          onClick={() => onPhaseChange("entities")}
        >
          第二阶段：构建物体
        </button>
      </div>
    </div>
  </>
);
