import { API_USERS } from "../../../system/app/config.js";
import type { DesignerLevelEditorPageProps } from "./objects/designer-level-editor-page-types.js";
import { useDesignerLevelEditorViewModel } from "./hooks/useDesignerLevelEditorViewModel.js";
import { LevelEditorModeRouter } from "./LevelEditorModeRouter.js";

export const DesignerLevelEditorPage = (props: DesignerLevelEditorPageProps) => {
  const {
    userId = API_USERS.designer.id,
    mode = "design",
    archiveBackupId,
    resumeLevelId,
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
  } = props;

  const vm = useDesignerLevelEditorViewModel({
    userId,
    mode,
    archiveBackupId,
    resumeLevelId,
    onExitJsonCheck,
  });

  return (
    <LevelEditorModeRouter
      vm={vm}
      mode={mode}
      {...(archiveBackupId !== undefined ? { archiveBackupId } : {})}
      {...(resumeLevelId !== undefined ? { resumeLevelId } : {})}
      {...(onBack !== undefined ? { onBack } : {})}
      {...(onOpenSettingsPage !== undefined ? { onOpenSettingsPage } : {})}
      {...(onExitSettingsPage !== undefined ? { onExitSettingsPage } : {})}
      {...(onOpenDesignBook !== undefined ? { onOpenDesignBook } : {})}
      {...(onExitDesignBook !== undefined ? { onExitDesignBook } : {})}
      {...(onOpenJsonCheck !== undefined ? { onOpenJsonCheck } : {})}
      {...(onExitJsonCheck !== undefined ? { onExitJsonCheck } : {})}
      {...(onOpenArchive !== undefined ? { onOpenArchive } : {})}
      {...(onExitArchive !== undefined ? { onExitArchive } : {})}
      {...(onOpenArchiveJsonCheck !== undefined ? { onOpenArchiveJsonCheck } : {})}
      {...(onExitArchiveJsonCheck !== undefined ? { onExitArchiveJsonCheck } : {})}
    />
  );
};
