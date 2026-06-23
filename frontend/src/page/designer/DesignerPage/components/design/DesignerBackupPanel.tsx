import type { DesignerBackup } from "../../../../../objects/designer-page/designer-page-types.js";

type DesignerBackupPanelProps = {
  backups: DesignerBackup[];
  maxBackups: number;
  onOpenArchive?: ((archiveBackupId: string) => void) | undefined;
  onRestoreBackup: (backupId: string) => void;
};

export const DesignerBackupPanel = ({
  backups,
  maxBackups,
  onOpenArchive,
  onRestoreBackup,
}: DesignerBackupPanelProps) => (
  <section className="designer-backup-panel">
    <div className="card-header">
      <strong>存档备份</strong>
      <span>最多保留 {maxBackups} 份，超出后自动替换最早备份</span>
    </div>
    {backups.length === 0 ? <p className="meta">当前还没有备份。</p> : null}
    {backups.map((backup) => (
      <div key={backup.id} className="designer-backup-item">
        <div>
          <strong>{backup.title || "未命名草稿"}</strong>
          <p className="meta">{new Date(backup.createdAt).toLocaleString("zh-CN")}</p>
        </div>
        <div className="designer-backup-actions">
          <button type="button" className="secondary" onClick={() => onOpenArchive?.(backup.archiveId)}>
            查看备份
          </button>
          <button type="button" className="secondary" onClick={() => onRestoreBackup(backup.id)}>
            恢复
          </button>
        </div>
      </div>
    ))}
  </section>
);
