import type { LevelData } from "../../../../objects/level/level/level-data.js";
import type { LevelTag } from "../../../../objects/system/system-objects.js";
import { cloneLevelData, formatArchiveTimestamp, serializeDraft } from "../../../../lib/designer-page/draft-functions.js";
import type { DesignerBackup } from "../../../../objects/designer-page/designer-page-types.js";
import { MAX_DESIGNER_BACKUPS, useDesignerBackups } from "./useDesignerBackups.js";

export { MAX_DESIGNER_BACKUPS } from "./useDesignerBackups.js";

type DraftRestoreInput = {
  title: string;
  description: string;
  selectedTags: LevelTag[];
  levelData: LevelData;
};

type UseDesignerBackupActionsParams = {
  title: string;
  description: string;
  selectedTags: LevelTag[];
  levelData: LevelData;
  restoreDraftAndClearHistory: (draft: DraftRestoreInput) => void;
  setMessage: (message: string) => void;
  setError: (error: string) => void;
};

export const useDesignerBackupActions = ({
  title,
  description,
  selectedTags,
  levelData,
  restoreDraftAndClearHistory,
  setMessage,
  setError,
}: UseDesignerBackupActionsParams) => {
  const { designerBackups, setDesignerBackups } = useDesignerBackups();

  const createCurrentDraftSnapshot = () => ({
    title,
    description,
    selectedTags: [...selectedTags],
    levelData: cloneLevelData(levelData),
  });

  const handleCreateBackup = () => {
    const draftSnapshot = createCurrentDraftSnapshot();
    const draftSignature = serializeDraft(draftSnapshot);
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
      ...draftSnapshot,
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

    restoreDraftAndClearHistory(backup);
    setMessage(`已恢复备份 ${new Date(backup.createdAt).toLocaleString("zh-CN")}`);
    setError("");
  };

  return {
    designerBackups,
    handleCreateBackup,
    handleRestoreBackup,
  };
};
