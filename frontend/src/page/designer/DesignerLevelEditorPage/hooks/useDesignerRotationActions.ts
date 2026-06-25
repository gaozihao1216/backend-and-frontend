import {
  getGroupTransformSnapshot,
  getSelectionFrame,
  rotateEntitiesAroundSelectionCenter,
  updateObstacleAngle,
} from "../../../../level/function/designer-level.js";
import type { LevelData, LevelObstacle } from "../../../../objects/level/level/level-data.js";
import { normalizeAngle } from "../function/ground/ground-tuning-functions.js";

type ApplyLevelDataUpdate = (updater: LevelData | ((current: LevelData) => LevelData)) => void;

type UseDesignerRotationActionsParams = {
  levelData: LevelData;
  selectedEntityIds: string[];
  groupRotationAngle: number;
  groupSelectionCenter: { x: number; y: number } | null;
  groupSelectionSize: { width: number; height: number } | null;
  selectedObstacle: LevelObstacle | null;
  applyLevelDataUpdate: ApplyLevelDataUpdate;
  setGroupRotationAngle: (angle: number) => void;
};

export const useDesignerRotationActions = ({
  levelData,
  selectedEntityIds,
  groupRotationAngle,
  groupSelectionCenter,
  groupSelectionSize,
  selectedObstacle,
  applyLevelDataUpdate,
  setGroupRotationAngle,
}: UseDesignerRotationActionsParams) => {
  const handleRotationAngleChange = (angle: number) => {
    if (selectedEntityIds.length > 1) {
      const snapshot = getGroupTransformSnapshot(levelData, selectedEntityIds);
      const frame = groupSelectionCenter && groupSelectionSize
        ? {
            centerX: groupSelectionCenter.x,
            centerY: groupSelectionCenter.y,
            width: groupSelectionSize.width,
            height: groupSelectionSize.height,
            rotation: groupRotationAngle,
          }
        : getSelectionFrame(
            levelData,
            selectedEntityIds,
            groupRotationAngle,
            groupSelectionCenter ?? undefined,
          );
      if (!snapshot || !frame) {
        return;
      }

      const deltaAngle = normalizeAngle(angle - groupRotationAngle);
      const nextLevelData = rotateEntitiesAroundSelectionCenter(
        levelData,
        snapshot,
        { x: frame.centerX, y: frame.centerY },
        deltaAngle,
      );
      if (nextLevelData !== levelData) {
        applyLevelDataUpdate(nextLevelData);
        setGroupRotationAngle(angle);
      }
      return;
    }

    if (!selectedObstacle) {
      return;
    }

    applyLevelDataUpdate((current) => updateObstacleAngle(current, selectedObstacle.id, angle));
  };

  return {
    handleRotationAngleChange,
  };
};
