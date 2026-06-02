import type { ReactNode } from "react";

type CeilingControlsProps = {
  showCeilingBoundaryControls: boolean;
  showGenerateGroundControl: boolean;
  hasCeilingBoundary: boolean;
  bottomThicknessControl: ReactNode;
  onCreateCeilingBoundary: () => void;
  onDeleteCeilingBoundary: () => void;
  onGenerateGroundFromCeiling: () => void;
};

export const CeilingControls = ({
  showCeilingBoundaryControls,
  showGenerateGroundControl,
  hasCeilingBoundary,
  bottomThicknessControl,
  onCreateCeilingBoundary,
  onDeleteCeilingBoundary,
  onGenerateGroundFromCeiling,
}: CeilingControlsProps) => (
  <>
    {showCeilingBoundaryControls ? (
      <div className="designer-grid-controls designer-ground-controls">
        <button
          type="button"
          className="secondary"
          disabled={hasCeilingBoundary}
          onClick={onCreateCeilingBoundary}
        >
          创建天花板
        </button>
        <button
          type="button"
          className="secondary"
          disabled={!hasCeilingBoundary}
          onClick={onDeleteCeilingBoundary}
        >
          删除天花板
        </button>
        <span className="meta">
          天花板默认可以为空。创建后可继续拖拽控制点，首尾点不会被锁定到世界左右边界。
        </span>
      </div>
    ) : null}
    {showGenerateGroundControl ? (
      <div className="designer-grid-controls designer-ground-controls">
        {bottomThicknessControl}
        <button
          type="button"
          className="secondary"
          disabled={!hasCeilingBoundary}
          onClick={onGenerateGroundFromCeiling}
        >
          根据天花板生成地面
        </button>
      </div>
    ) : null}
  </>
);
