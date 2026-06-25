import type { DesignerLevelEditorPageProps } from "./objects/designer-level-editor-page-types.js";
import type { DesignerLevelEditorViewModel } from "./hooks/useDesignerLevelEditorViewModel.js";
import { ArchivePanel } from "./components/archive/ArchivePanel.js";
import { DesignBookPage } from "./components/design-book/DesignBookPage/index.js";
import { DesignerDesignWorkspace } from "./components/design/DesignerDesignWorkspace.js";
import { JsonCheckPanel } from "./components/json-check/JsonCheckPanel.js";
import { SettingsPage } from "./components/settings/SettingsPage/index.js";

type LevelEditorModeRouterProps = {
  vm: DesignerLevelEditorViewModel;
  mode?: DesignerLevelEditorPageProps["mode"];
  archiveBackupId?: string;
  resumeLevelId?: string;
  onBack?: () => void;
  onOpenSettingsPage?: () => void;
  onExitSettingsPage?: () => void;
  onOpenDesignBook?: () => void;
  onExitDesignBook?: () => void;
  onOpenJsonCheck?: () => void;
  onExitJsonCheck?: () => void;
  onOpenArchive?: (archiveBackupId: string) => void;
  onExitArchive?: () => void;
  onOpenArchiveJsonCheck?: (archiveBackupId: string) => void;
  onExitArchiveJsonCheck?: () => void;
};

export const LevelEditorModeRouter = ({
  vm,
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
}: LevelEditorModeRouterProps) => {
  const { backup, groundEditor, groundTuning, level, coordinator } = vm;

  if (mode === "archive_json_check") {
    if (!backup.archiveBackup) {
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
        value={JSON.stringify(backup.archiveBackup.levelData, null, 2)}
        readOnly
        onExit={onExitArchiveJsonCheck}
      />
    );
  }

  if (mode === "archive") {
    return (
      <ArchivePanel
        archiveBackupId={archiveBackupId}
        archiveBackup={backup.archiveBackup}
        terrainEditMode={groundEditor.terrainEditMode}
        groundStrokeSimplifyConfig={groundTuning.groundStrokeSimplifyConfig}
        onExitArchive={onExitArchive}
        onOpenArchiveJsonCheck={onOpenArchiveJsonCheck}
        onRestore={(draft) => {
          coordinator.restoreDraftAndClearHistory(draft);
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
        value={level.jsonText}
        error={level.jsonError}
        onExit={onExitJsonCheck}
        onConfirm={coordinator.handleConfirmJsonChange}
        onChange={level.handleJsonTextChange}
      />
    );
  }

  if (mode === "settings") {
    return (
      <SettingsPage
        onExitSettingsPage={onExitSettingsPage}
        groundStrokeSimplifyConfig={groundTuning.groundStrokeSimplifyConfig}
        setGroundStrokeSimplifyConfig={groundTuning.setGroundStrokeSimplifyConfig}
        boundaryBreakpointEpsilon={groundTuning.boundaryBreakpointEpsilon}
        setBoundaryBreakpointEpsilonState={groundTuning.setBoundaryBreakpointEpsilonState}
        groundMaterialRenderConfig={groundTuning.groundMaterialRenderConfig}
        setGroundMaterialRenderConfigState={groundTuning.setGroundMaterialRenderConfigState}
        updateGroundStrokeSimplifyConfig={groundTuning.updateGroundStrokeSimplifyConfig}
        updateBoundaryBreakpointEpsilon={groundTuning.updateBoundaryBreakpointEpsilon}
        updateGroundMaterialRenderConfig={groundTuning.updateGroundMaterialRenderConfig}
        bottomThickness={groundEditor.bottomThickness}
      />
    );
  }

  if (mode === "design_book") {
    return <DesignBookPage onExitDesignBook={onExitDesignBook} />;
  }

  return (
    <DesignerDesignWorkspace
      vm={vm}
      onBack={onBack}
      onOpenSettingsPage={onOpenSettingsPage}
      onOpenDesignBook={onOpenDesignBook}
      onOpenJsonCheck={onOpenJsonCheck}
      onOpenArchive={onOpenArchive}
    />
  );
};
