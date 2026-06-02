import { createDefaultLevelInput } from "../../api/index.js";
import { API_USERS } from "../../lib/config.js";
import { createDraftLevelSource } from "../../lib/level-repository.js";
import {
  removeEntity,
} from "../../lib/designer-level.js";
import type { LevelData, LevelTag } from "../../lib/level-contracts.js";
import { useDesignerDraft, availableTags } from "../../hook/designer-page/useDesignerDraft.js";
import { MAX_DESIGNER_BACKUPS, useDesignerBackupActions } from "../../hook/designer-page/useDesignerBackupActions.js";
import { useDesignerGroundTuning } from "../../hook/designer-page/useDesignerGroundTuning.js";
import { isEditableTarget, useDesignerKeyboardShortcuts } from "../../hook/designer-page/useDesignerKeyboardShortcuts.js";
import { useDesignerEditor } from "../../hook/designer-page/useDesignerEditor.js";
import { useDesignerGroundEditor } from "../../hook/designer-page/useDesignerGroundEditor.js";
import { useDesignerLevelDataController } from "../../hook/designer-page/useDesignerLevelDataController.js";
import { useDesignerFeedback } from "../../hook/designer-page/useDesignerFeedback.js";
import { useDesignerLevelSubmission } from "../../hook/designer-page/useDesignerLevelSubmission.js";
import { useDesignerKeyboardActions } from "../../hook/designer-page/useDesignerKeyboardActions.js";
import { useDesignerGroundActions } from "../../hook/designer-page/useDesignerGroundActions.js";
import { useDesignerRotationActions } from "../../hook/designer-page/useDesignerRotationActions.js";
import type { DesignerPageProps, DesignerPhase } from "../../object/designer-page/designer-page-types.js";
import { ArchivePanel } from "../../component/designer-page/ArchivePanel.js";
import { DesignerHeader } from "../../component/designer-page/DesignerHeader.js";
import { DesignBookPage } from "../../component/designer-page/DesignBookPage/index.js";
import { SettingsPage } from "../../component/designer-page/SettingsPage/index.js";
import { JsonCheckPanel } from "../../component/designer-page/JsonCheckPanel.js";
import { LevelFormPanel } from "../../component/designer-page/LevelFormPanel.js";
import { DesignerBackupPanel } from "../../component/designer-page/DesignerBackupPanel.js";
import { CreatedLevelsPanel } from "../../component/designer-page/CreatedLevelsPanel.js";
import { DraftPreviewPanel } from "../../component/designer-page/DraftPreviewPanel.js";
import { DesignerCreateActions } from "../../component/designer-page/DesignerCreateActions.js";
import { DesignerCanvasPanel } from "../../component/designer-page/DesignerCanvasPanel.js";
import { GroundEditorToggleControls } from "../../component/designer-page/GroundEditorToggleControls.js";
import { CeilingControls } from "../../component/designer-page/CeilingControls.js";
import { VoidSpanControls } from "../../component/designer-page/VoidSpanControls.js";
import { GroundPointControls } from "../../component/designer-page/GroundPointControls.js";
import { DesignerActionBar } from "../../component/designer-page/DesignerActionBar.js";
import { DesignerGridControls } from "../../component/designer-page/DesignerGridControls.js";
import { DesignerEntityControls } from "../../component/designer-page/DesignerEntityControls.js";

const initialDesignerLevelData = createDefaultLevelInput().data;

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
    toggleTag,
  } = useDesignerDraft();
  const { message, setMessage, error, setError } = useDesignerFeedback();
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
    onLevelDataReplaced: () => resetEditorSelection(),
  });
  const editor = useDesignerEditor({ levelData });
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
  const {
    handleTerrainBoundaryTypeChange,
    handleTerrainEditModeChange,
    handleToggleGroundEditor,
    handleCreateCeilingBoundary,
    handleDeleteCeilingBoundary,
    handleGenerateGroundFromCeiling,
    handleMoveGroundPointForward,
    handleMoveGroundPointBackward,
    handleRemoveGroundPoint,
    handleRemoveVoidSpan,
  } = useDesignerGroundActions({
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
  const rotationAngle = editor.selectedEntityIds.length > 1
    ? editor.groupRotationAngle
    : editor.selectedObstacle?.angle ?? 0;
  const rotationDisabled = editor.activeTool !== "rotate"
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

  const handleConfirmJsonChange = () => {
    if (tryApplyJsonText()) {
      onExitJsonCheck?.();
    }
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
          restoreDraftAndClearHistory(backup);
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
        <DesignerEntityControls
          activeTool={editor.activeTool}
          rotationAngle={rotationAngle}
          rotationDisabled={rotationDisabled}
          onToolChange={editor.setActiveTool}
          onRotationAngleChange={handleRotationAngleChange}
        />
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
