import { API_USERS } from "../../../lib/config.js";
import type { DesignerPageProps } from "../../../objects/designer-page/designer-page-types.js";
import { useDesignerPageViewModel } from "./hooks/useDesignerPageViewModel.js";
import { DesignerPageRouter } from "./DesignerPageRouter.js";

export const DesignerPage = (props: DesignerPageProps) => {
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

  const vm = useDesignerPageViewModel({
    userId,
    mode,
    archiveBackupId,
    resumeLevelId,
    onExitJsonCheck,
  });

  return (
    <DesignerPageRouter
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
