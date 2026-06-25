import type { DesignerPageProps } from "../../../../../objects/designer-page/designer-page-types.js";
import type { DesignerPageViewModel } from "../../hooks/useDesignerPageViewModel.js";
import { DesignerHeader } from "./DesignerHeader.js";
import { LevelFormPanel } from "./LevelFormPanel.js";
import { DesignerLevelBackgroundPanel } from "./DesignerLevelBackgroundPanel.js";
import { DesignerEntityControls } from "./DesignerEntityControls.js";
import { DesignerGridControls } from "./DesignerGridControls.js";
import { DesignerGroundControlsSection } from "./DesignerGroundControlsSection.js";
import { DesignerActionBar } from "./DesignerActionBar.js";
import { DesignerBackupPanel } from "./DesignerBackupPanel.js";
import { DesignerCanvasPanel } from "./DesignerCanvasPanel.js";
import { DraftPreviewPanel } from "./DraftPreviewPanel.js";
import { DesignerCreateActions } from "./DesignerCreateActions.js";
import { CreatedLevelsPanel } from "./CreatedLevelsPanel.js";

type DesignerDesignWorkspaceProps = {
  vm: DesignerPageViewModel;
  onBack?: DesignerPageProps["onBack"];
  onOpenSettingsPage?: DesignerPageProps["onOpenSettingsPage"];
  onOpenDesignBook?: DesignerPageProps["onOpenDesignBook"];
  onOpenJsonCheck?: DesignerPageProps["onOpenJsonCheck"];
  onOpenArchive?: DesignerPageProps["onOpenArchive"];
};

export const DesignerDesignWorkspace = ({
  vm,
  onBack,
  onOpenSettingsPage,
  onOpenDesignBook,
  onOpenJsonCheck,
  onOpenArchive,
}: DesignerDesignWorkspaceProps) => {
  const { draft, feedback, level, editor, groundEditor, groundTuning, groundActions, backup, submission, background, draftPreviewLevel, rotation, coordinator, userId } = vm;

  return (
    <section className="panel designer-workspace-panel">
      <DesignerHeader
        designerPhase={groundEditor.designerPhase}
        onBack={onBack}
        onOpenSettingsPage={onOpenSettingsPage}
        onOpenDesignBook={onOpenDesignBook}
        onPhaseChange={coordinator.switchDesignerPhase}
      />

      <LevelFormPanel
        title={draft.title}
        description={draft.description}
        selectedTags={draft.selectedTags}
        availableTags={draft.availableTags}
        onTitleChange={draft.setTitle}
        onDescriptionChange={draft.setDescription}
        onToggleTag={draft.toggleTag}
      />

      <DesignerLevelBackgroundPanel
        userId={userId}
        selectedTemplateId={level.levelData.backgroundTemplateId}
        onSelectTemplate={coordinator.handleBackgroundTemplateChange}
      />

      {groundEditor.designerPhase === "entities" ? (
        <DesignerEntityControls
          activeTool={editor.activeTool}
          rotationAngle={rotation.rotationAngle}
          rotationDisabled={rotation.rotationDisabled}
          onToolChange={editor.setActiveTool}
          onRotationAngleChange={rotation.handleRotationAngleChange}
        />
      ) : null}

      <DesignerGridControls gridSize={editor.gridSize} onGridSizeChange={editor.setGridSize} />

      <DesignerGroundControlsSection groundEditor={groundEditor} groundActions={groundActions} />

      <DesignerActionBar
        undoDisabled={level.undoHistory.length === 0}
        redoDisabled={level.redoHistory.length === 0}
        deleteSelectedDisabled={groundEditor.designerPhase !== "entities" || editor.selectedEntityIds.length === 0}
        onUndo={level.handleUndo}
        onRedo={level.handleRedo}
        onCreateBackup={backup.handleCreateBackup}
        onDeleteSelected={coordinator.handleDeleteSelected}
        onOpenJsonCheck={onOpenJsonCheck}
      />

      <DesignerBackupPanel
        backups={backup.designerBackups}
        maxBackups={backup.maxBackups}
        onOpenArchive={onOpenArchive}
        onRestoreBackup={backup.handleRestoreBackup}
      />

      <DesignerCanvasPanel
        activeTool={editor.activeTool}
        levelData={level.levelData}
        editorPhase={groundEditor.designerPhase}
        selectedEntityIds={editor.selectedEntityIds}
        primarySelectedEntityId={editor.primarySelectedEntityId}
        onChange={level.applyLevelDataUpdate}
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
        groundStrokeSimplifyConfig={groundTuning.groundStrokeSimplifyConfig}
        selectedGroundPointIndex={groundEditor.selectedGroundPointIndex}
        onGroundPointSelectionChange={groundEditor.setSelectedGroundPointIndex}
        selectedVoidSpanId={groundEditor.selectedVoidSpanId}
        onVoidSpanSelectionChange={groundEditor.setSelectedVoidSpanId}
        entityEditingEnabled={groundEditor.designerPhase === "entities"}
        levelBackgroundTemplate={background.template}
        levelBackgroundPanelDesign={background.panelBackgroundDesign}
        levelBackgroundCloudDesigns={background.cloudPatternDesigns}
      />

      <DraftPreviewPanel
        title={draft.title}
        description={draft.description}
        tags={draft.selectedTags}
        data={draftPreviewLevel.data}
        authorId={userId}
      />

      <DesignerCreateActions isTitleMissing={draft.isTitleMissing} onCreate={submission.handleCreate} />

      {feedback.message ? <p className="feedback success">{feedback.message}</p> : null}
      {feedback.error ? <p className="feedback error">{feedback.error}</p> : null}

      <CreatedLevelsPanel
        createdLevels={submission.createdLevels}
        submittedIds={submission.submittedIds}
        onSubmitLevel={submission.handleSubmit}
      />
    </section>
  );
};
