import { useEffect, useRef } from "react";
import { createDefaultLevelInput } from "../../api/index.js";
import { getDesignerPortfolioItemById } from "../../lib/designer-portfolio-mock.js";
import { removeEntity } from "../../lib/designer-level.js";
import { createDraftLevelSource } from "../../lib/level-repository.js";
import type { LevelData } from "../../objects/level/level/level-data.js";
import type { LevelTag } from "../../objects/system/system-objects.js";
import type { DesignerPageProps, DesignerPhase } from "../../objects/designer-page/designer-page-types.js";
import { useDesignerDraft, availableTags } from "./useDesignerDraft.js";
import { MAX_DESIGNER_BACKUPS, useDesignerBackupActions } from "./useDesignerBackupActions.js";
import { useDesignerGroundTuning } from "./useDesignerGroundTuning.js";
import { isEditableTarget, useDesignerKeyboardShortcuts } from "./useDesignerKeyboardShortcuts.js";
import { useDesignerEditor } from "./useDesignerEditor.js";
import { useDesignerGroundEditor } from "./useDesignerGroundEditor.js";
import { useDesignerLevelDataController } from "./useDesignerLevelDataController.js";
import { useDesignerFeedback } from "./useDesignerFeedback.js";
import { useDesignerLevelSubmission } from "./useDesignerLevelSubmission.js";
import { useDesignerKeyboardActions } from "./useDesignerKeyboardActions.js";
import { useDesignerGroundActions } from "./useDesignerGroundActions.js";
import { useDesignerRotationActions } from "./useDesignerRotationActions.js";
import { useLevelBackgroundTemplateResolution } from "../useLevelBackgroundTemplateResolution.js";

const initialDesignerLevelData = createDefaultLevelInput().data;

export type DesignerPageViewModel = ReturnType<typeof useDesignerPageViewModel>;

export const useDesignerPageViewModel = ({
  userId,
  mode = "design",
  archiveBackupId,
  resumeLevelId,
  onExitJsonCheck,
}: {
  userId: string;
  mode?: DesignerPageProps["mode"];
  archiveBackupId?: string | undefined;
  resumeLevelId?: string | undefined;
  onExitJsonCheck?: (() => void) | undefined;
}) => {
  const {
    title,
    setTitle,
    description,
    setDescription,
    selectedTags,
    setSelectedTags,
    toggleTag,
  } = useDesignerDraft();
  const { message, setMessage, error, setError } = useDesignerFeedback();

  const resetEditorSelectionRef = useRef<() => void>(() => {});

  const {
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
  } = useDesignerLevelDataController({
    initialLevelData: initialDesignerLevelData,
    onLevelDataReplaced: () => resetEditorSelectionRef.current(),
  });

  const editor = useDesignerEditor({ levelData });
  const groundTuning = useDesignerGroundTuning();
  const groundEditor = useDesignerGroundEditor({ levelData });
  const isTitleMissing = title.trim().length === 0;

  const {
    createdLevels,
    submittedIds,
    handleCreate,
    handleSubmit,
  } = useDesignerLevelSubmission({
    userId,
    title,
    description,
    selectedTags,
    levelData,
    isTitleMissing,
    setMessage,
    setError,
  });

  const draftPreviewLevel = createDraftLevelSource({
    title,
    description,
    tags: selectedTags,
    data: levelData,
    authorId: userId,
  }).level;

  const background = useLevelBackgroundTemplateResolution(levelData.backgroundTemplateId, userId);

  const resetEditorSelection = () => {
    editor.resetEditorSelection();
    groundEditor.resetGroundSelection();
  };
  resetEditorSelectionRef.current = resetEditorSelection;

  const switchDesignerPhase = (nextPhase: DesignerPhase) => {
    groundEditor.setDesignerPhase(nextPhase);
    editor.setSelectedEntityIds([]);
    editor.setPrimarySelectedEntityId(null);
    groundEditor.resetGroundSelection();
    groundEditor.setGroundEditorEnabled(nextPhase === "ground");
    editor.setActiveTool("select");
  };

  const restoreDraft = (draft: {
    title: string;
    description: string;
    selectedTags: LevelTag[];
    levelData: LevelData;
  }) => {
    setTitle(draft.title);
    setDescription(draft.description);
    setSelectedTags(draft.selectedTags);
    setLevelDataAndSyncJson(draft.levelData);
    resetEditorSelection();
  };

  const restoreDraftAndClearHistory = (draft: {
    title: string;
    description: string;
    selectedTags: LevelTag[];
    levelData: LevelData;
  }) => {
    restoreDraft(draft);
    clearHistory();
  };

  const resumedPortfolioLevelIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!resumeLevelId || mode !== "design" || resumedPortfolioLevelIdRef.current === resumeLevelId) {
      return;
    }

    const portfolioItem = getDesignerPortfolioItemById(resumeLevelId);
    if (!portfolioItem || portfolioItem.status !== "draft") {
      setError("未找到可继续编辑的草稿关卡。");
      return;
    }

    resumedPortfolioLevelIdRef.current = resumeLevelId;
    restoreDraftAndClearHistory({
      title: portfolioItem.title,
      description: portfolioItem.description,
      selectedTags: portfolioItem.tags.filter((tag): tag is LevelTag => availableTags.includes(tag as LevelTag)),
      levelData: initialDesignerLevelData,
    });
    setMessage(`已打开草稿「${portfolioItem.title}」，可继续编辑。`);
    setError("");
  }, [mode, resumeLevelId, setError, setMessage]);

  const { designerBackups, handleCreateBackup, handleRestoreBackup } = useDesignerBackupActions({
    title,
    description,
    selectedTags,
    levelData,
    restoreDraftAndClearHistory,
    setMessage,
    setError,
  });

  const archiveBackup = archiveBackupId
    ? designerBackups.find((backup) => backup.archiveId === archiveBackupId) ?? null
    : null;

  const groundActions = useDesignerGroundActions({
    activeBoundaryKind: groundEditor.activeBoundaryKind,
    applyLevelDataUpdate,
    bottomThickness: groundEditor.bottomThickness,
    levelData,
    selectedGroundPointIndex: groundEditor.selectedGroundPointIndex,
    selectedVoidSpanId: groundEditor.selectedVoidSpanId,
    setGroundEditorEnabled: groundEditor.setGroundEditorEnabled,
    setTerrainEditMode: groundEditor.setTerrainEditMode,
    setSelectedGroundPointIndex: groundEditor.setSelectedGroundPointIndex,
    setSelectedVoidSpanId: groundEditor.setSelectedVoidSpanId,
  });

  const rotationAngle =
    editor.selectedEntityIds.length > 1
      ? editor.groupRotationAngle
      : editor.selectedObstacle?.angle ?? 0;
  const rotationDisabled =
    editor.activeTool !== "rotate"
    || (editor.selectedEntityIds.length === 1 ? !editor.selectedObstacle : editor.selectedEntityIds.length === 0);

  const { handleRotationAngleChange } = useDesignerRotationActions({
    levelData,
    selectedEntityIds: editor.selectedEntityIds,
    groupRotationAngle: editor.groupRotationAngle,
    groupSelectionCenter: editor.groupSelectionCenter,
    groupSelectionSize: editor.groupSelectionSize,
    selectedObstacle: editor.selectedObstacle,
    applyLevelDataUpdate,
    setGroupRotationAngle: editor.setGroupRotationAngle,
  });

  const handleDeleteSelected = () => {
    if (editor.selectedEntityIds.length === 0) {
      return;
    }

    applyLevelDataUpdate((current) =>
      editor.selectedEntityIds.reduce((nextLevelData, entityId) => removeEntity(nextLevelData, entityId), current),
    );
    editor.setSelectedEntityIds([]);
    editor.setPrimarySelectedEntityId(null);
  };

  const {
    handleUndoShortcut,
    handleRedoShortcut,
    handleCopyShortcut,
    handlePasteShortcut,
    handleCutShortcut,
    handleDeleteShortcut,
  } = useDesignerKeyboardActions({
    undoHistoryLength: undoHistory.length,
    redoHistoryLength: redoHistory.length,
    handleUndo,
    handleRedo,
    levelData,
    selectedEntityIds: editor.selectedEntityIds,
    primarySelectedEntityId: editor.primarySelectedEntityId,
    setClipboardSelection: editor.setClipboardSelection,
    clipboardSelection: editor.clipboardSelection,
    canvasPointer: editor.canvasPointer,
    applyLevelDataUpdate,
    setSelectedEntityIds: editor.setSelectedEntityIds,
    setPrimarySelectedEntityId: editor.setPrimarySelectedEntityId,
    setActiveTool: editor.setActiveTool,
    groundEditorEnabled: groundEditor.groundEditorEnabled,
    terrainEditMode: groundEditor.terrainEditMode,
    selectedVoidSpanId: groundEditor.selectedVoidSpanId,
    selectedGroundPointIndex: groundEditor.selectedGroundPointIndex,
    activeBoundaryKind: groundEditor.activeBoundaryKind,
    setSelectedVoidSpanId: groundEditor.setSelectedVoidSpanId,
    setSelectedGroundPointIndex: groundEditor.setSelectedGroundPointIndex,
    handleDeleteSelected,
  });

  useDesignerKeyboardShortcuts(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) {
        return;
      }

      if (handleUndoShortcut(event)) return;
      if (handleRedoShortcut(event)) return;
      if (handleCopyShortcut(event)) return;
      if (handleCutShortcut(event)) return;
      if (handlePasteShortcut(event)) return;
      if (handleDeleteShortcut(event)) return;
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === "Alt") {
        editor.setIsAltPressed(false);
      }
    };

    const handleModifierState = (event: KeyboardEvent) => {
      if (event.key === "Alt") {
        editor.setIsAltPressed(event.type === "keydown");
      }
    };

    return { handleKeyDown, handleKeyUp, handleModifierState };
  }, [
    groundEditor.activeBoundaryKind,
    editor.canvasPointer,
    editor.clipboardSelection,
    groundEditor.groundEditorEnabled,
    levelData,
    editor.primarySelectedEntityId,
    redoHistory,
    editor.selectedEntityIds,
    groundEditor.selectedGroundPointIndex,
    groundEditor.selectedVoidSpanId,
    groundEditor.terrainEditMode,
    undoHistory,
  ]);

  const handleBackgroundTemplateChange = (backgroundTemplateId: string | undefined) => {
    applyLevelDataUpdate((current) => {
      if (!backgroundTemplateId) {
        const { backgroundTemplateId: _removed, ...rest } = current;
        return rest;
      }

      return { ...current, backgroundTemplateId };
    });
  };

  const handleConfirmJsonChange = () => {
    if (tryApplyJsonText()) {
      onExitJsonCheck?.();
    }
  };

  return {
    draft: {
      title,
      setTitle,
      description,
      setDescription,
      selectedTags,
      toggleTag,
      isTitleMissing,
      availableTags,
    },
    feedback: { message, error },
    level: {
      levelData,
      jsonText,
      jsonError,
      undoHistory,
      redoHistory,
      applyLevelDataUpdate,
      handleUndo,
      handleRedo,
      handleJsonTextChange,
      tryApplyJsonText,
    },
    editor,
    groundEditor,
    groundTuning,
    groundActions,
    backup: {
      designerBackups,
      maxBackups: MAX_DESIGNER_BACKUPS,
      archiveBackup,
      handleCreateBackup,
      handleRestoreBackup,
    },
    submission: {
      createdLevels,
      submittedIds,
      handleCreate,
      handleSubmit,
    },
    background,
    draftPreviewLevel,
    rotation: {
      rotationAngle,
      rotationDisabled,
      handleRotationAngleChange,
    },
    coordinator: {
      switchDesignerPhase,
      restoreDraftAndClearHistory,
      handleDeleteSelected,
      handleBackgroundTemplateChange,
      handleConfirmJsonChange,
    },
    userId,
    archiveBackupId,
  };
};
