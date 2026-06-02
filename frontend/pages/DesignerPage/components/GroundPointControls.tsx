import type { LevelGround } from "../../../../lib/level-contracts.js";

type GroundPointControlsProps = {
  visible: boolean;
  selectedGroundPointIndex: number | null;
  activeBoundary: LevelGround | null;
  onMoveGroundPointForward: () => void;
  onMoveGroundPointBackward: () => void;
  onRemoveGroundPoint: () => void;
};

export const GroundPointControls = ({
  visible,
  selectedGroundPointIndex,
  activeBoundary,
  onMoveGroundPointForward,
  onMoveGroundPointBackward,
  onRemoveGroundPoint,
}: GroundPointControlsProps) => (
  <>
    {visible ? (
      <div className="designer-grid-controls designer-ground-controls">
        <button
          type="button"
          className="secondary"
          disabled={selectedGroundPointIndex === null || selectedGroundPointIndex <= 1}
          onClick={onMoveGroundPointForward}
        >
          向前重排
        </button>
        <button
          type="button"
          className="secondary"
          disabled={selectedGroundPointIndex === null || !activeBoundary || selectedGroundPointIndex >= (activeBoundary.type === "line" ? activeBoundary.points.length - 2 : activeBoundary.controlPoints.length - 2)}
          onClick={onMoveGroundPointBackward}
        >
          向后重排
        </button>
        <button
          type="button"
          className="secondary"
          disabled={
            selectedGroundPointIndex === null
            || !activeBoundary
            || (activeBoundary.type === "line" ? activeBoundary.points.length <= 2 : activeBoundary.controlPoints.length <= 3)
          }
          onClick={onRemoveGroundPoint}
        >
          删除当前点
        </button>
      </div>
    ) : null}
  </>
);
