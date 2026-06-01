import { useState, type ChangeEvent } from "react";
import { EditorToolbar } from "../../components/designer/EditorToolbar.js";
import { RotationKnob } from "../../components/designer/RotationKnob.js";
import { createLevel, submitLevel } from "../../lib/api.js";
import { API_USERS } from "../../lib/config.js";
import {
  clearTerrainCeilingBoundary,
  createBottomBoundaryFromTop,
  ensureTerrainCeilingBoundary,
  getLevelTerrain,
  removeTerrainBoundaryPoint,
  removeTerrainVoidSpan,
  reorderTerrainBoundaryPoint,
  setTerrainBoundaryType,
  type TerrainEditMode,
} from "../../lib/ground.js";
import { createDraftLevelSource } from "../../lib/level-repository.js";
import {
  getEntitySnapshots,
  getEntitySnapshot,
  getGroupTransformSnapshot,
  getSelectionFrame,
  pasteClipboardSelection,
  removeEntity,
  rotateEntitiesAroundSelectionCenter,
  updateObstacleAngle,
} from "../../lib/designer-level.js";
import type { Level, LevelData, LevelTag, Submission } from "../../../shared/types.js";
import { useDesignerDraft, availableTags } from "./hooks/useDesignerDraft.js";
import { MAX_UNDO_STEPS, useDesignerHistory } from "./hooks/useDesignerHistory.js";
import { MAX_DESIGNER_BACKUPS, useDesignerBackups } from "./hooks/useDesignerBackups.js";
import { useDesignerGroundTuning } from "./hooks/useDesignerGroundTuning.js";
import { isEditableTarget, useDesignerKeyboardShortcuts } from "./hooks/useDesignerKeyboardShortcuts.js";
import { useDesignerEditor } from "./hooks/useDesignerEditor.js";
import { useDesignerGroundEditor } from "./hooks/useDesignerGroundEditor.js";
import { cloneLevelData, formatArchiveTimestamp, serializeDraft } from "./functions/draft-functions.js";
import { handleGroundEditorDelete } from "./functions/ground-editor-actions.js";
import { normalizeAngle } from "./functions/ground-tuning-functions.js";
import type { DesignerBackup, DesignerPageProps, DesignerPhase } from "./objects/designer-page-types.js";
import { ArchivePanel } from "./components/ArchivePanel.js";
import { DesignerHeader } from "./components/DesignerHeader.js";
import { DesignBookPage } from "./components/DesignBookPage/index.js";
import { SettingsPage } from "./components/SettingsPage/index.js";
import { JsonCheckPanel } from "./components/JsonCheckPanel.js";
import { LevelFormPanel } from "./components/LevelFormPanel.js";
import { DesignerBackupPanel } from "./components/DesignerBackupPanel.js";
import { CreatedLevelsPanel } from "./components/CreatedLevelsPanel.js";
import { DraftPreviewPanel } from "./components/DraftPreviewPanel.js";
import { DesignerCreateActions } from "./components/DesignerCreateActions.js";
import { DesignerCanvasPanel } from "./components/DesignerCanvasPanel.js";
import { GroundEditorToggleControls } from "./components/GroundEditorToggleControls.js";
import { CeilingControls } from "./components/CeilingControls.js";
import { VoidSpanControls } from "./components/VoidSpanControls.js";
import { GroundPointControls } from "./components/GroundPointControls.js";
import { DesignerActionBar } from "./components/DesignerActionBar.js";
import { DesignerGridControls } from "./components/DesignerGridControls.js";

export const DesignerPage = ({
  userId = API_USERS.designer.id,
  mode = "design",
  archiveBackupId,
  onBack,
  onOpenSettingsPage,
  onExitSettingsPage,
  onOpenDesignBook,
  onExitDesignBook,
  onOpenJsonCheck,
  onExitJsonCheck,
  onOpenArchive,
  onExitArchive,
  onOpenArchiveJsonCheck,
  onExitArchiveJsonCheck,
}: DesignerPageProps) => {
  // 设计器页面同时维护三类状态：
  // 1. 关卡表单（标题、描述、标签）
  // 2. 可视化编辑状态（当前工具、选中对象）
  // 3. 后端交互结果（已创建关卡、提交成功消息等）
  const {
    title,
    setTitle,
    description,
    setDescription,
    selectedTags,
    setSelectedTags,
    levelData,
    setLevelData,
    jsonText,
    setJsonText,
    jsonError,
    setJsonError,
    createdLevels,
    setCreatedLevels,
    submittedIds,
    setSubmittedIds,
    message,
    setMessage,
    error,
    setError,
  } = useDesignerDraft();
  const editor = useDesignerEditor({ levelData });
  const { undoHistory, setUndoHistory, redoHistory, setRedoHistory, clearHistory } = useDesignerHistory();
  const { designerBackups, setDesignerBackups } = useDesignerBackups();
  const {
    groundStrokeSimplifyConfig,
    setGroundStrokeSimplifyConfig,
    boundaryBreakpointEpsilon,
    setBoundaryBreakpointEpsilonState,
    groundMaterialRenderConfig,
    setGroundMaterialRenderConfigState,
    updateGroundStrokeSimplifyConfig,
    updateBoundaryBreakpointEpsilon,
    updateGroundMaterialRenderConfig,
  } = useDesignerGroundTuning();
  const groundEditor = useDesignerGroundEditor({ levelData });
  const isTitleMissing = title.trim().length === 0;
  const draftPreviewLevel = createDraftLevelSource({
    title,
    description,
    tags: selectedTags,
    data: levelData,
    authorId: userId,
  }).level;
  const archiveBackup = archiveBackupId
    ? designerBackups.find((backup) => backup.archiveId === archiveBackupId) ?? null
    : null;

  const resetEditorSelection = () => {
    editor.resetEditorSelection();
    groundEditor.resetGroundSelection();
  };

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
    setLevelData(cloneLevelData(draft.levelData));
    setJsonText(JSON.stringify(draft.levelData, null, 2));
    setJsonError("");
    resetEditorSelection();
  };

  const applyLevelDataUpdate = (updater: LevelData | ((current: LevelData) => LevelData)) => {
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

      setLevelData(cloneLevelData(previousLevelData));
      setJsonText(JSON.stringify(previousLevelData, null, 2));
      setJsonError("");
      setRedoHistory((redo) => [cloneLevelData(levelData), ...redo].slice(0, MAX_UNDO_STEPS));
      resetEditorSelection();
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
      setLevelData(cloneLevelData(nextLevelData));
      setJsonText(JSON.stringify(nextLevelData, null, 2));
      setJsonError("");
      resetEditorSelection();
      return history.slice(1);
    });
  };

  const handleCreateBackup = () => {
    const draft = {
      title,
      description,
      selectedTags: [...selectedTags],
      levelData: cloneLevelData(levelData),
    };
    const draftSignature = serializeDraft(draft);
    if (designerBackups.some((backup) => serializeDraft(backup) === draftSignature)) {
      setMessage("当前内容与已有备份一致，已跳过重复备份");
      setError("");
      return;
    }

    const createdAtDate = new Date();
    const backup: DesignerBackup = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      archiveId: formatArchiveTimestamp(createdAtDate),
      createdAt: createdAtDate.toISOString(),
      ...draft,
    };

    setDesignerBackups((current) => [backup, ...current].slice(0, MAX_DESIGNER_BACKUPS));
    setMessage(`已保存备份 ${new Date(backup.createdAt).toLocaleString("zh-CN")}`);
    setError("");
  };

  const handleRestoreBackup = (backupId: string) => {
    const backup = designerBackups.find((item) => item.id === backupId);
    if (!backup) {
      return;
    }

    restoreDraft(backup);
    setUndoHistory([]);
    setRedoHistory([]);
    setMessage(`已恢复备份 ${new Date(backup.createdAt).toLocaleString("zh-CN")}`);
    setError("");
  };

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

  const handleDeleteShortcut = (
    event: KeyboardEvent,
  ): boolean => {
    if (event.key !== "Delete") {
      return false;
    }

    if (handleGroundEditorDelete({
      groundEditorEnabled: groundEditor.groundEditorEnabled,
      terrainEditMode: groundEditor.terrainEditMode,
      selectedVoidSpanId: groundEditor.selectedVoidSpanId,
      selectedGroundPointIndex: groundEditor.selectedGroundPointIndex,
      activeBoundaryKind: groundEditor.activeBoundaryKind,
      levelData,
      applyLevelDataUpdate,
      setSelectedVoidSpanId: groundEditor.setSelectedVoidSpanId,
      setSelectedGroundPointIndex: groundEditor.setSelectedGroundPointIndex,
    })) {
      event.preventDefault();
      return true;
    }

    // 设计器支持 Delete 快捷删除，行为与图形编辑工具保持一致。
    if (editor.selectedEntityIds.length === 0) {
      return false;
    }

    event.preventDefault();
    handleDeleteSelected();
    return true;
  };

  const handleUndoShortcut = (event: KeyboardEvent): boolean => {
    const modifierPressed = event.ctrlKey || event.metaKey;
    if (!modifierPressed || event.shiftKey || event.key.toLowerCase() !== "z") {
      return false;
    }

    if (undoHistory.length === 0) {
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

    if (redoHistory.length === 0) {
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

    const snapshots = getEntitySnapshots(levelData, editor.selectedEntityIds);
    if (snapshots.length === 0) {
      return false;
    }

    event.preventDefault();
    editor.setClipboardSelection({
      entities: snapshots,
      primaryEntityId: editor.primarySelectedEntityId,
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

    if (!editor.clipboardSelection || !editor.canvasPointer) {
      return false;
    }

    event.preventDefault();
    const pasted = pasteClipboardSelection(levelData, editor.clipboardSelection, editor.canvasPointer);
    if (!pasted) {
      return true;
    }

    applyLevelDataUpdate(pasted.levelData);
    editor.setSelectedEntityIds(pasted.entityIds);
    editor.setPrimarySelectedEntityId(pasted.primaryEntityId);
    editor.setActiveTool("select");
    return true;
  };

  const handleCutShortcut = (
    event: KeyboardEvent,
  ): boolean => {
    const modifierPressed = event.ctrlKey || event.metaKey;
    if (!modifierPressed || event.key.toLowerCase() !== "x") {
      return false;
    }

    if (!editor.primarySelectedEntityId) {
      return false;
    }

    const snapshot = getEntitySnapshot(levelData, editor.primarySelectedEntityId);
    if (!snapshot) {
      return false;
    }

    const snapshots = getEntitySnapshots(levelData, editor.selectedEntityIds);
    event.preventDefault();
    editor.setClipboardSelection({
      entities: snapshots,
      primaryEntityId: editor.primarySelectedEntityId,
    });
    applyLevelDataUpdate((current) =>
      editor.selectedEntityIds.reduce((nextLevelData, entityId) => removeEntity(nextLevelData, entityId), current),
    );
    editor.setSelectedEntityIds([]);
    editor.setPrimarySelectedEntityId(null);
    editor.setActiveTool("select");
    return true;
  };

  useDesignerKeyboardShortcuts(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) {
        return;
      }

      if (handleUndoShortcut(event)) {
        return;
      }

      if (handleRedoShortcut(event)) {
        return;
      }

      if (handleCopyShortcut(event)) {
        return;
      }

      if (handleCutShortcut(event)) {
        return;
      }

      if (handlePasteShortcut(event)) {
        return;
      }

      if (handleDeleteShortcut(event)) {
        return;
      }
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
  }, [groundEditor.activeBoundaryKind, editor.canvasPointer, editor.clipboardSelection, groundEditor.groundEditorEnabled, levelData, editor.primarySelectedEntityId, redoHistory, editor.selectedEntityIds, groundEditor.selectedGroundPointIndex, groundEditor.selectedVoidSpanId, groundEditor.terrainEditMode, undoHistory]);

  const handleJsonTextChange = (nextJsonText: string) => {
    setJsonText(nextJsonText);
    setJsonError("");
  };

  const handleConfirmJsonChange = () => {
    try {
      const parsedLevelData = JSON.parse(jsonText) as LevelData;
      applyLevelDataUpdate(parsedLevelData);
      setJsonError("");
      onExitJsonCheck?.();
    } catch (caught) {
      setJsonError(caught instanceof Error ? caught.message : "Invalid JSON");
    }
  };

  const handleCreate = async () => {
    setError("");
    setMessage("");

    if (isTitleMissing) {
      setError("请先填写 Title，再创建关卡。");
      return;
    }

    try {
      // create 只负责保存草稿关卡，不会自动进入审核流程。
      const level = await createLevel(userId, {
        title,
        description,
        tags: selectedTags,
        data: levelData,
      });
      setCreatedLevels((current) => [level, ...current]);
      setMessage(`Created level ${level.id}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to create level");
    }
  };

  const toggleTag = (tag: LevelTag) => {
    setSelectedTags((current) =>
      current.includes(tag) ? current.filter((candidate) => candidate !== tag) : [...current, tag],
    );
  };

  const handleSubmit = async (levelId: string) => {
    setError("");
    setMessage("");

    try {
      // submit 针对已经创建到后端的 levelId，而不是当前本地草稿。
      const submission: Submission = await submitLevel(userId, levelId);
      setSubmittedIds((current) => [...current, submission.levelId]);
      setMessage(`Submitted ${submission.levelId} for review`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to submit level");
    }
  };

  const handleTerrainBoundaryTypeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextType = event.target.value as "line" | "bezier";
    applyLevelDataUpdate((current) => setTerrainBoundaryType(current, groundEditor.activeBoundaryKind, nextType));
  };

  const handleTerrainEditModeChange = (nextTerrainEditMode: TerrainEditMode) => {
    groundEditor.setTerrainEditMode(nextTerrainEditMode);
    groundEditor.resetGroundSelection();
  };

  const handleToggleGroundEditor = () => {
    groundEditor.setGroundEditorEnabled((current) => !current);
    groundEditor.resetGroundSelection();
  };

  const updateCeilingBoundary = (updater: (current: LevelData) => LevelData) => {
    applyLevelDataUpdate((current) => updater(current));
    groundEditor.setSelectedGroundPointIndex(null);
  };

  const handleCreateCeilingBoundary = () => {
    updateCeilingBoundary(ensureTerrainCeilingBoundary);
  };

  const handleDeleteCeilingBoundary = () => {
    updateCeilingBoundary(clearTerrainCeilingBoundary);
  };

  const handleGenerateGroundFromCeiling = () => {
    applyLevelDataUpdate((current) => {
      const currentTerrain = getLevelTerrain(current);
      if (!currentTerrain.ceilingBoundary) {
        return current;
      }
      return {
        ...current,
        ground: currentTerrain.groundBoundary,
        terrain: {
          ...currentTerrain,
          groundBoundary: createBottomBoundaryFromTop(current, currentTerrain.ceilingBoundary, groundEditor.bottomThickness),
        },
      };
    });
  };

  const moveGroundPoint = (direction: "left" | "right") => {
    if (groundEditor.selectedGroundPointIndex === null) {
      return;
    }
    const reordered = reorderTerrainBoundaryPoint(levelData, groundEditor.activeBoundaryKind, groundEditor.selectedGroundPointIndex, direction);
    applyLevelDataUpdate(reordered.levelData);
    groundEditor.setSelectedGroundPointIndex(reordered.pointIndex);
  };

  const handleMoveGroundPointForward = () => {
    moveGroundPoint("left");
  };

  const handleMoveGroundPointBackward = () => {
    moveGroundPoint("right");
  };

  const handleRemoveGroundPoint = () => {
    if (groundEditor.selectedGroundPointIndex === null) {
      return;
    }
    const removed = removeTerrainBoundaryPoint(levelData, groundEditor.activeBoundaryKind, groundEditor.selectedGroundPointIndex);
    applyLevelDataUpdate(removed.levelData);
    groundEditor.setSelectedGroundPointIndex(removed.nextSelectedPointIndex);
  };

  const handleRemoveVoidSpan = () => {
    if (!groundEditor.selectedVoidSpanId) {
      return;
    }
    const voidSpanId = groundEditor.selectedVoidSpanId;
    applyLevelDataUpdate((current) => removeTerrainVoidSpan(current, voidSpanId));
    groundEditor.setSelectedVoidSpanId(null);
  };

  const handleRotationAngleChange = (angle: number) => {
    if (editor.selectedEntityIds.length > 1) {
      const snapshot = getGroupTransformSnapshot(levelData, editor.selectedEntityIds);
      const frame = editor.groupSelectionCenter && editor.groupSelectionSize
        ? {
            centerX: editor.groupSelectionCenter.x,
            centerY: editor.groupSelectionCenter.y,
            width: editor.groupSelectionSize.width,
            height: editor.groupSelectionSize.height,
            rotation: editor.groupRotationAngle,
          }
        : getSelectionFrame(
            levelData,
            editor.selectedEntityIds,
            editor.groupRotationAngle,
            editor.groupSelectionCenter ?? undefined,
          );
      if (!snapshot || !frame) {
        return;
      }

      const deltaAngle = normalizeAngle(angle - editor.groupRotationAngle);
      const nextLevelData = rotateEntitiesAroundSelectionCenter(
        levelData,
        snapshot,
        { x: frame.centerX, y: frame.centerY },
        deltaAngle,
      );
      if (nextLevelData !== levelData) {
        applyLevelDataUpdate(nextLevelData);
        editor.setGroupRotationAngle(angle);
      }
      return;
    }

    if (!editor.selectedObstacle) {
      return;
    }

    applyLevelDataUpdate((current) => updateObstacleAngle(current, editor.selectedObstacle!.id, angle));
  };

  if (mode === "archive_json_check") {
    if (!archiveBackup) {
      return (
        <section className="panel designer-workspace-panel designer-json-check-page">
          <div className="actions">
            <button type="button" className="secondary" onClick={onExitArchiveJsonCheck}>
              退出
            </button>
          </div>
          <h2>{`archive_${archiveBackupId ?? "unknown"}/json_check`}</h2>
          <p className="feedback error">未找到对应的备份。</p>
        </section>
      );
    }

    return (
      <JsonCheckPanel
        title={`archive_${archiveBackupId ?? "unknown"}/json_check`}
        description="这里展示的是备份对应的 JSON 内容，只读查看，不会修改当前 design 草稿。"
        label="Backup JSON"
        value={JSON.stringify(archiveBackup.levelData, null, 2)}
        readOnly
        onExit={onExitArchiveJsonCheck}
      />
    );
  }

  if (mode === "archive") {
    return (
      <ArchivePanel
        archiveBackupId={archiveBackupId}
        archiveBackup={archiveBackup}
        terrainEditMode={groundEditor.terrainEditMode}
        groundStrokeSimplifyConfig={groundStrokeSimplifyConfig}
        onExitArchive={onExitArchive}
        onOpenArchiveJsonCheck={onOpenArchiveJsonCheck}
        onRestore={(backup) => {
          restoreDraft(backup);
          clearHistory();
          onExitArchive?.();
        }}
      />
    );
  }

  if (mode === "json_check") {
    return (
      <JsonCheckPanel
        title="designer/design/json_check"
        description="在这里查看或修改当前设计草稿的 JSON 文件。只有点击“确认修改”后才会写回设计器。"
        label="LevelData JSON"
        value={jsonText}
        error={jsonError}
        onExit={onExitJsonCheck}
        onConfirm={handleConfirmJsonChange}
        onChange={handleJsonTextChange}
      />
    );
  }

  if (mode === "settings") {
    return (
      <SettingsPage
        onExitSettingsPage={onExitSettingsPage}
        groundStrokeSimplifyConfig={groundStrokeSimplifyConfig}
        setGroundStrokeSimplifyConfig={setGroundStrokeSimplifyConfig}
        boundaryBreakpointEpsilon={boundaryBreakpointEpsilon}
        setBoundaryBreakpointEpsilonState={setBoundaryBreakpointEpsilonState}
        groundMaterialRenderConfig={groundMaterialRenderConfig}
        setGroundMaterialRenderConfigState={setGroundMaterialRenderConfigState}
        updateGroundStrokeSimplifyConfig={updateGroundStrokeSimplifyConfig}
        updateBoundaryBreakpointEpsilon={updateBoundaryBreakpointEpsilon}
        updateGroundMaterialRenderConfig={updateGroundMaterialRenderConfig}
        bottomThickness={groundEditor.bottomThickness}
      />
    );
  }

  if (mode === "design_book") {
    return <DesignBookPage onExitDesignBook={onExitDesignBook} />;
  }

  return (
    <section className="panel designer-workspace-panel">
      <DesignerHeader
        designerPhase={groundEditor.designerPhase}
        onBack={onBack}
        onOpenSettingsPage={onOpenSettingsPage}
        onOpenDesignBook={onOpenDesignBook}
        onPhaseChange={switchDesignerPhase}
      />

      <LevelFormPanel
        title={title}
        description={description}
        selectedTags={selectedTags}
        availableTags={availableTags}
        onTitleChange={setTitle}
        onDescriptionChange={setDescription}
        onToggleTag={toggleTag}
      />

      {groundEditor.designerPhase === "entities" ? (
        <div className="designer-toolbar-row">
          <EditorToolbar activeTool={editor.activeTool} onToolChange={editor.setActiveTool} />
          <div className="rotation-controls-panel">
            <div className="rotation-controls">
              <RotationKnob
                label="粗调"
                angle={editor.selectedEntityIds.length > 1 ? editor.groupRotationAngle : editor.selectedObstacle?.angle ?? 0}
                disabled={editor.activeTool !== "rotate" || (editor.selectedEntityIds.length === 1 ? !editor.selectedObstacle : editor.selectedEntityIds.length === 0)}
                precisionMultiplier={1}
                variant="coarse"
                onChange={handleRotationAngleChange}
              />
              <RotationKnob
                label="微调"
                angle={editor.selectedEntityIds.length > 1 ? editor.groupRotationAngle : editor.selectedObstacle?.angle ?? 0}
                disabled={editor.activeTool !== "rotate" || (editor.selectedEntityIds.length === 1 ? !editor.selectedObstacle : editor.selectedEntityIds.length === 0)}
                precisionMultiplier={10}
                variant="fine"
                onChange={handleRotationAngleChange}
              />
            </div>
            <div className="rotation-angle-readout">
              <strong>{Math.round((((editor.selectedEntityIds.length > 1 ? editor.groupRotationAngle : editor.selectedObstacle?.angle ?? 0) * 180) / Math.PI))}°</strong>
            </div>
          </div>
        </div>
      ) : null}
      <DesignerGridControls
        gridSize={editor.gridSize}
        onGridSizeChange={editor.setGridSize}
      />
      {groundEditor.designerPhase === "ground" ? (
      <>
      <GroundEditorToggleControls
        terrainEditMode={groundEditor.terrainEditMode}
        activeBoundary={groundEditor.activeBoundary}
        groundEditorEnabled={groundEditor.groundEditorEnabled}
        onBoundaryTypeChange={handleTerrainBoundaryTypeChange}
        onTerrainEditModeChange={handleTerrainEditModeChange}
        onToggleGroundEditor={handleToggleGroundEditor}
      />
      <CeilingControls
        showCeilingBoundaryControls={groundEditor.groundEditorEnabled && groundEditor.terrainEditMode === "ceiling-boundary"}
        showGenerateGroundControl={groundEditor.groundEditorEnabled}
        hasCeilingBoundary={!!groundEditor.terrain.ceilingBoundary}
        bottomThicknessControl={(
          <label className="designer-grid-size">
            <span>默认厚度</span>
            <input
              type="range"
              min={48}
              max={220}
              step={4}
              value={groundEditor.bottomThickness}
              onChange={(event) => groundEditor.setBottomThickness(Number(event.target.value))}
            />
            <strong>{groundEditor.bottomThickness}</strong>
          </label>
        )}
        onCreateCeilingBoundary={handleCreateCeilingBoundary}
        onDeleteCeilingBoundary={handleDeleteCeilingBoundary}
        onGenerateGroundFromCeiling={handleGenerateGroundFromCeiling}
      />
      <GroundPointControls
        visible={groundEditor.groundEditorEnabled && groundEditor.terrainEditMode !== "hollow"}
        selectedGroundPointIndex={groundEditor.selectedGroundPointIndex}
        activeBoundary={groundEditor.activeBoundary}
        onMoveGroundPointForward={handleMoveGroundPointForward}
        onMoveGroundPointBackward={handleMoveGroundPointBackward}
        onRemoveGroundPoint={handleRemoveGroundPoint}
      />
      <VoidSpanControls
        visible={groundEditor.groundEditorEnabled && groundEditor.terrainEditMode === "hollow"}
        selectedVoidSpanId={groundEditor.selectedVoidSpanId}
        onRemoveVoidSpan={handleRemoveVoidSpan}
      />
      </>
      ) : null}
      <DesignerActionBar
        undoDisabled={undoHistory.length === 0}
        redoDisabled={redoHistory.length === 0}
        deleteSelectedDisabled={groundEditor.designerPhase !== "entities" || editor.selectedEntityIds.length === 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onCreateBackup={handleCreateBackup}
        onDeleteSelected={handleDeleteSelected}
        onOpenJsonCheck={onOpenJsonCheck}
      />
      <DesignerBackupPanel
        backups={designerBackups}
        maxBackups={MAX_DESIGNER_BACKUPS}
        onOpenArchive={onOpenArchive}
        onRestoreBackup={handleRestoreBackup}
      />

      <DesignerCanvasPanel
        activeTool={editor.activeTool}
        levelData={levelData}
        editorPhase={groundEditor.designerPhase}
        selectedEntityIds={editor.selectedEntityIds}
        primarySelectedEntityId={editor.primarySelectedEntityId}
        onChange={applyLevelDataUpdate}
        onSelectionChange={(entityIds, primaryEntityId) => {
          editor.setSelectedEntityIds(entityIds);
          editor.setPrimarySelectedEntityId(primaryEntityId);
        }}
        onToolChange={editor.setActiveTool}
        onPointerWorldChange={editor.setCanvasPointer}
        gridVisible={editor.isAltPressed}
        gridSnapEnabled={editor.isAltPressed}
        gridSize={editor.gridSize}
        isSnapTemporarilyDisabled={false}
        groupSelectionRotationAngle={editor.groupRotationAngle}
        onGroupSelectionRotationAngleChange={editor.setGroupRotationAngle}
        groupSelectionCenter={editor.groupSelectionCenter}
        onGroupSelectionCenterChange={editor.setGroupSelectionCenter}
        groupSelectionSize={editor.groupSelectionSize}
        onGroupSelectionSizeChange={editor.setGroupSelectionSize}
        groundEditEnabled={groundEditor.groundEditorEnabled}
        terrainEditMode={groundEditor.terrainEditMode}
        groundStrokeSimplifyConfig={groundStrokeSimplifyConfig}
        selectedGroundPointIndex={groundEditor.selectedGroundPointIndex}
        onGroundPointSelectionChange={groundEditor.setSelectedGroundPointIndex}
        selectedVoidSpanId={groundEditor.selectedVoidSpanId}
        onVoidSpanSelectionChange={groundEditor.setSelectedVoidSpanId}
        entityEditingEnabled={groundEditor.designerPhase === "entities"}
      />

      <DraftPreviewPanel
        title={title}
        description={description}
        tags={selectedTags}
        data={draftPreviewLevel.data}
        authorId={userId}
      />

      <DesignerCreateActions
        isTitleMissing={isTitleMissing}
        onCreate={handleCreate}
      />

      {message ? <p className="feedback success">{message}</p> : null}
      {error ? <p className="feedback error">{error}</p> : null}

      <CreatedLevelsPanel
        createdLevels={createdLevels}
        submittedIds={submittedIds}
        onSubmitLevel={handleSubmit}
      />
    </section>
  );
};
