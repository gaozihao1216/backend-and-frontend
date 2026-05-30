import { useState } from "react";
import type { LevelData } from "../../../../shared/types.js";

export const MAX_UNDO_STEPS = 100;

export const useDesignerHistory = () => {
  const [undoHistory, setUndoHistory] = useState<LevelData[]>([]);
  const [redoHistory, setRedoHistory] = useState<LevelData[]>([]);

  const clearHistory = () => {
    setUndoHistory([]);
    setRedoHistory([]);
  };

  return {
    undoHistory,
    setUndoHistory,
    redoHistory,
    setRedoHistory,
    clearHistory,
  };
};
