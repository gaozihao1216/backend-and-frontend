import { useState } from "react";
import type { LevelData } from "../../../../shared/types.js";
import { cloneLevelData } from "../functions/draft-functions.js";

type ApplyLevelDataUpdate = (updater: LevelData | ((current: LevelData) => LevelData)) => void;

type UseDesignerLevelDataControllerParams = {
  initialLevelData: LevelData;
};

export const useDesignerLevelDataController = ({
  initialLevelData,
}: UseDesignerLevelDataControllerParams) => {
  const [levelData, setLevelData] = useState<LevelData>(initialLevelData);
  const [jsonText, setJsonText] = useState(JSON.stringify(initialLevelData, null, 2));
  const [jsonError, setJsonError] = useState("");

  const setLevelDataAndSyncJson = (
    nextLevelData: LevelData,
  ) => {
    setLevelData(cloneLevelData(nextLevelData));
    setJsonText(JSON.stringify(nextLevelData, null, 2));
    setJsonError("");
  };

  const tryApplyJsonText = (applyLevelDataUpdate: ApplyLevelDataUpdate): boolean => {
    try {
      const parsedLevelData = JSON.parse(jsonText) as LevelData;
      applyLevelDataUpdate(parsedLevelData);
      setJsonError("");
      return true;
    } catch (caught) {
      setJsonError(caught instanceof Error ? caught.message : "Invalid JSON");
      return false;
    }
  };

  return {
    levelData,
    setLevelData,
    jsonText,
    setJsonText,
    jsonError,
    setJsonError,
    setLevelDataAndSyncJson,
    tryApplyJsonText,
  };
};
