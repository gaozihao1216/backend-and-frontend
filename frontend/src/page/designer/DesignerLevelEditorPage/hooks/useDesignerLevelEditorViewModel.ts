import { useEffect, useRef } from "react";
import { createDefaultLevelInput } from "../../../../system/api/exports/index.js";
import { getDesignerPortfolioItemById } from "../../shared/objects/designer-portfolio-mock.js";
import { removeEntity } from "../../../../level/function/designer-level.js";
import { createDraftLevelSource } from "../../../../level/function/level-repository.js";
import type { LevelData } from "../../../../objects/level/level/level-data.js";
import type { LevelTag } from "../../../../objects/system/system-objects.js";
import type { DesignerLevelEditorPageProps, DesignerPhase } from "../objects/designer-level-editor-page-types.js";
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
import { useLevelBackgroundTemplateResolution } from "../../../shared/hooks/level-background/useLevelBackgroundTemplateResolution.js";

const initialDesignerLevelData = createDefaultLevelInput().data;

export type DesignerLevelEditorViewModel = ReturnType<typeof useDesignerLevelEditorViewModel>;

/**
 * 设计器页面的总 view model。
 *
 * 页面组件只负责布局和渲染；草稿表单、关卡数据、画布选择、地形编辑、
 * 备份、提交流程、快捷键等状态都在这里组合，避免 index.tsx 直接堆业务逻辑。
 */
export const useDesignerLevelEditorViewModel = ({
  userId,
  mode = "design",
  archiveBackupId,
  resumeLevelId,
  onExitJsonCheck,
}: {
  userId: string;
  mode?: DesignerLevelEditorPageProps["mode"];
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

  // undo/redo、JSON 导入、恢复备份都会整体替换关卡数据，因此需要统一清空画布选择。
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

  // 普通实体选择和地形点选择属于两套编辑模式，切换/恢复时必须一起清理。
  const resetEditorSelection = () => {
    editor.resetEditorSelection();
    groundEditor.resetGroundSelection();
  };
  resetEditorSelectionRef.current = resetEditorSelection;

  // 设计阶段切换会重置工具和选择，避免在地形模式下残留实体旋转/多选状态。
  const switchDesignerPhase = (nextPhase: DesignerPhase) => {
    groundEditor.setDesignerPhase(nextPhase);
    editor.setSelectedEntityIds([]);
    editor.setPrimarySelectedEntityId(null);
    groundEditor.resetGroundSelection();
    groundEditor.setGroundEditorEnabled(nextPhase === "ground");
    editor.setActiveTool("select");
  };

  // 恢复草稿只替换页面内容，不负责清空历史；是否清空由上层场景决定。
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
    // 从作品集继续编辑只在首次进入该 levelId 时执行，避免后续输入被 effect 覆盖。
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

  // 删除当前实体选择；地形点/空洞删除由 keyboard action 中的 ground editor 分支处理。
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
    // 快捷键只在非输入控件上生效，防止编辑标题/JSON 时触发画布操作。
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

  // JSON 校验页应用成功后回到设计页，失败时保留在当前页面显示错误。
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
