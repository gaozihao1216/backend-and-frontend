import {
  getEntitySnapshot,
  getEntitySnapshots,
  pasteClipboardSelection,
  removeEntity,
} from "../../../lib/designer-level.js";
import type { EditorClipboardSelection, EditorTool } from "../../../lib/designer-level.js";
import type { TerrainBoundaryKind, TerrainEditMode } from "../../../lib/ground.js";
import type { LevelData } from "../../../lib/level-contracts.js";
import { handleGroundEditorDelete } from "../functions/ground-editor-actions.js";

type ApplyLevelDataUpdate = (updater: LevelData | ((current: LevelData) => LevelData)) => void;

type UseDesignerKeyboardActionsParams = {
  undoHistoryLength: number;
  redoHistoryLength: number;
  handleUndo: () => void;
  handleRedo: () => void;
  levelData: LevelData;
  selectedEntityIds: string[];
  primarySelectedEntityId: string | null;
  setClipboardSelection: (selection: EditorClipboardSelection | null) => void;
  clipboardSelection: EditorClipboardSelection | null;
  canvasPointer: { x: number; y: number } | null;
  applyLevelDataUpdate: ApplyLevelDataUpdate;
  setSelectedEntityIds: (entityIds: string[]) => void;
  setPrimarySelectedEntityId: (entityId: string | null) => void;
  setActiveTool: (tool: EditorTool) => void;
  groundEditorEnabled: boolean;
  terrainEditMode: TerrainEditMode;
  selectedVoidSpanId: string | null;
  selectedGroundPointIndex: number | null;
  activeBoundaryKind: TerrainBoundaryKind;
  setSelectedVoidSpanId: (value: string | null) => void;
  setSelectedGroundPointIndex: (value: number | null) => void;
  handleDeleteSelected: () => void;
};

export const useDesignerKeyboardActions = ({
  undoHistoryLength,
  redoHistoryLength,
  handleUndo,
  handleRedo,
  levelData,
  selectedEntityIds,
  primarySelectedEntityId,
  setClipboardSelection,
  clipboardSelection,
  canvasPointer,
  applyLevelDataUpdate,
  setSelectedEntityIds,
  setPrimarySelectedEntityId,
  setActiveTool,
  groundEditorEnabled,
  terrainEditMode,
  selectedVoidSpanId,
  selectedGroundPointIndex,
  activeBoundaryKind,
  setSelectedVoidSpanId,
  setSelectedGroundPointIndex,
  handleDeleteSelected,
}: UseDesignerKeyboardActionsParams) => {
  const handleUndoShortcut = (event: KeyboardEvent): boolean => {
    const modifierPressed = event.ctrlKey || event.metaKey;
    if (!modifierPressed || event.shiftKey || event.key.toLowerCase() !== "z") {
      return false;
    }

    if (undoHistoryLength === 0) {
      return false;
    }

    event.preventDefault();
    handleUndo();
    return true;
  };

  const handleRedoShortcut = (event: KeyboardEvent): boolean => {
    const modifierPressed = event.ctrlKey || event.metaKey;
    if (
      !modifierPressed
      || (
        event.key.toLowerCase() !== "y"
        && (!event.shiftKey || event.key.toLowerCase() !== "z")
      )
    ) {
      return false;
    }

    if (redoHistoryLength === 0) {
      return false;
    }

    event.preventDefault();
    handleRedo();
    return true;
  };

  const handleCopyShortcut = (
    event: KeyboardEvent,
  ): boolean => {
    const modifierPressed = event.ctrlKey || event.metaKey;
    if (!modifierPressed || event.key.toLowerCase() !== "c") {
      return false;
    }

    const snapshots = getEntitySnapshots(levelData, selectedEntityIds);
    if (snapshots.length === 0) {
      return false;
    }

    event.preventDefault();
    setClipboardSelection({
      entities: snapshots,
      primaryEntityId: primarySelectedEntityId,
    });
    return true;
  };

  const handlePasteShortcut = (
    event: KeyboardEvent,
  ): boolean => {
    const modifierPressed = event.ctrlKey || event.metaKey;
    if (!modifierPressed || event.key.toLowerCase() !== "v") {
      return false;
    }

    if (!clipboardSelection || !canvasPointer) {
      return false;
    }

    event.preventDefault();
    const pasted = pasteClipboardSelection(levelData, clipboardSelection, canvasPointer);
    if (!pasted) {
      return true;
    }

    applyLevelDataUpdate(pasted.levelData);
    setSelectedEntityIds(pasted.entityIds);
    setPrimarySelectedEntityId(pasted.primaryEntityId);
    setActiveTool("select");
    return true;
  };

  const handleCutShortcut = (
    event: KeyboardEvent,
  ): boolean => {
    const modifierPressed = event.ctrlKey || event.metaKey;
    if (!modifierPressed || event.key.toLowerCase() !== "x") {
      return false;
    }

    if (!primarySelectedEntityId) {
      return false;
    }

    const snapshot = getEntitySnapshot(levelData, primarySelectedEntityId);
    if (!snapshot) {
      return false;
    }

    const snapshots = getEntitySnapshots(levelData, selectedEntityIds);
    event.preventDefault();
    setClipboardSelection({
      entities: snapshots,
      primaryEntityId: primarySelectedEntityId,
    });
    applyLevelDataUpdate((current) =>
      selectedEntityIds.reduce((nextLevelData, entityId) => removeEntity(nextLevelData, entityId), current),
    );
    setSelectedEntityIds([]);
    setPrimarySelectedEntityId(null);
    setActiveTool("select");
    return true;
  };

  const handleDeleteShortcut = (
    event: KeyboardEvent,
  ): boolean => {
    if (event.key !== "Delete") {
      return false;
    }

    if (handleGroundEditorDelete({
      groundEditorEnabled,
      terrainEditMode,
      selectedVoidSpanId,
      selectedGroundPointIndex,
      activeBoundaryKind,
      levelData,
      applyLevelDataUpdate,
      setSelectedVoidSpanId,
      setSelectedGroundPointIndex,
    })) {
      event.preventDefault();
      return true;
    }

    // 设计器支持 Delete 快捷删除，行为与图形编辑工具保持一致。
    if (selectedEntityIds.length === 0) {
      return false;
    }

    event.preventDefault();
    handleDeleteSelected();
    return true;
  };

  return {
    handleUndoShortcut,
    handleRedoShortcut,
    handleCopyShortcut,
    handlePasteShortcut,
    handleCutShortcut,
    handleDeleteShortcut,
  };
};
