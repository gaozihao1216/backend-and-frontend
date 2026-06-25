import { useState } from "react";
import type { LevelData } from "../../../../objects/level/level/level-data.js";
import { cloneLevelData } from "../function/draft/draft-functions.js";

type ApplyLevelDataUpdate = (updater: LevelData | ((current: LevelData) => LevelData)) => void;

const MAX_UNDO_STEPS = 100;

type UseDesignerLevelDataControllerParams = {
  initialLevelData: LevelData;
  onLevelDataReplaced: () => void;
};

/**
 * 关卡数据控制器。
 *
 * 负责维护 levelData、JSON 文本、JSON 错误、undo/redo 历史。
 * 所有会改变关卡结构的操作都应通过 applyLevelDataUpdate 进入，保证画布和 JSON 面板同步。
 */
export const useDesignerLevelDataController = ({
  initialLevelData,
  onLevelDataReplaced,
}: UseDesignerLevelDataControllerParams) => {
  const [levelData, setLevelData] = useState<LevelData>(initialLevelData);
  const [jsonText, setJsonText] = useState(JSON.stringify(initialLevelData, null, 2));
  const [jsonError, setJsonError] = useState("");
  const [undoHistory, setUndoHistory] = useState<LevelData[]>([]);
  const [redoHistory, setRedoHistory] = useState<LevelData[]>([]);

  const clearHistory = () => {
    setUndoHistory([]);
    setRedoHistory([]);
  };

  // 直接替换完整关卡数据，常用于恢复备份、撤销/重做、从 JSON 应用修改。
  const setLevelDataAndSyncJson = (
    nextLevelData: LevelData,
  ) => {
    setLevelData(cloneLevelData(nextLevelData));
    setJsonText(JSON.stringify(nextLevelData, null, 2));
    setJsonError("");
  };

  const applyLevelDataUpdate: ApplyLevelDataUpdate = (updater) => {
    // 所有对 levelData 的修改都走这一层，确保 JSON 面板与画布视图始终同步。
    setLevelData((current) => {
      const nextLevelData = typeof updater === "function" ? updater(current) : updater;
      if (nextLevelData === current) {
        return current;
      }

      setUndoHistory((history) => [cloneLevelData(current), ...history].slice(0, MAX_UNDO_STEPS));
      setRedoHistory([]);
      setJsonText(JSON.stringify(nextLevelData, null, 2));
      setJsonError("");
      return nextLevelData;
    });
  };

  const handleUndo = () => {
    setUndoHistory((history) => {
      const previousLevelData = history[0];
      if (!previousLevelData) {
        return history;
      }

      setLevelDataAndSyncJson(previousLevelData);
      setRedoHistory((redo) => [cloneLevelData(levelData), ...redo].slice(0, MAX_UNDO_STEPS));
      onLevelDataReplaced();
      return history.slice(1);
    });
  };

  const handleRedo = () => {
    setRedoHistory((history) => {
      const nextLevelData = history[0];
      if (!nextLevelData) {
        return history;
      }

      setUndoHistory((undo) => [cloneLevelData(levelData), ...undo].slice(0, MAX_UNDO_STEPS));
      setLevelDataAndSyncJson(nextLevelData);
      onLevelDataReplaced();
      return history.slice(1);
    });
  };

  // 将 JSON 面板的文本应用到关卡数据；解析失败只更新错误，不破坏当前画布。
  const tryApplyJsonText = (): boolean => {
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

  const handleJsonTextChange = (nextJsonText: string) => {
    setJsonText(nextJsonText);
    setJsonError("");
  };

  return {
    levelData,
    jsonText,
    jsonError,
    undoHistory,
    redoHistory,
    clearHistory,
    setLevelDataAndSyncJson,
    applyLevelDataUpdate,
    handleUndo,
    handleRedo,
    handleJsonTextChange,
    tryApplyJsonText,
  };
};
