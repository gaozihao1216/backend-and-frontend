import { LevelEditorCanvas } from "../designer/LevelEditorCanvas.js";
import type { GroundStrokeSimplifyConfig, TerrainEditMode } from "../../lib/ground.js";
import type { DesignerBackup } from "../../object/designer-page/designer-page-types.js";

type ArchivePanelProps = {
  archiveBackupId?: string | undefined;
  archiveBackup: DesignerBackup | null;
  terrainEditMode: TerrainEditMode;
  groundStrokeSimplifyConfig: GroundStrokeSimplifyConfig;
  onExitArchive?: (() => void) | undefined;
  onOpenArchiveJsonCheck?: ((archiveBackupId: string) => void) | undefined;
  onRestore: (backup: DesignerBackup) => void;
};

export const ArchivePanel = ({
  archiveBackupId,
  archiveBackup,
  terrainEditMode,
  groundStrokeSimplifyConfig,
  onExitArchive,
  onOpenArchiveJsonCheck,
  onRestore,
}: ArchivePanelProps) => (
  <section className="panel designer-workspace-panel designer-json-check-page">
    <div className="actions">
      <button type="button" className="secondary" onClick={onExitArchive}>
        退出
      </button>
      {archiveBackup ? (
        <button type="button" className="secondary" onClick={() => onOpenArchiveJsonCheck?.(archiveBackup.archiveId)}>
          查看Json文件
        </button>
      ) : null}
      {archiveBackup ? (
        <button type="button" onClick={() => onRestore(archiveBackup)}>
          恢复此备份
        </button>
      ) : null}
    </div>
    <h2>{`archive_${archiveBackupId ?? "unknown"}`}</h2>
    {archiveBackup ? (
      <>
        <p className="panel-copy">这里展示的是当前选中备份的内容。你可以先看可视化画布，确认是不是要找的备份，再决定是否恢复。</p>
        <LevelEditorCanvas
          activeTool="select"
          levelData={archiveBackup.levelData}
          editorPhase="ground"
          selectedEntityIds={[]}
          primarySelectedEntityId={null}
          onChange={() => {}}
          onSelectionChange={() => {}}
          onToolChange={() => {}}
          onPointerWorldChange={() => {}}
          gridVisible={false}
          gridSnapEnabled={false}
          gridSize={16}
          isSnapTemporarilyDisabled={false}
          groupSelectionRotationAngle={0}
          onGroupSelectionRotationAngleChange={() => {}}
          groupSelectionCenter={null}
          onGroupSelectionCenterChange={() => {}}
          groupSelectionSize={null}
          onGroupSelectionSizeChange={() => {}}
          groundEditEnabled={false}
          terrainEditMode={terrainEditMode}
          groundStrokeSimplifyConfig={groundStrokeSimplifyConfig}
          selectedGroundPointIndex={null}
          onGroundPointSelectionChange={() => {}}
          selectedVoidSpanId={null}
          onVoidSpanSelectionChange={() => {}}
          entityEditingEnabled={false}
          readOnly
        />
      </>
    ) : (
      <p className="feedback error">未找到对应的备份。</p>
    )}
  </section>
);
