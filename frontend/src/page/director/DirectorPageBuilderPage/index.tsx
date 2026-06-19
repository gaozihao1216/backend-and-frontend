import { PageBuilderWorkspace } from "../../../component/director-page/page-builder/PageBuilderWorkspace.js";
import { useDirectorPageBuilder } from "../../../hook/director-page/useDirectorPageBuilder.js";
import type { DirectorPageBuilderPageProps } from "../../../objects/director-page/page-builder-types.js";

export const DirectorPageBuilderPage = ({
  userId,
  pageId,
  targetPath = "/",
  onBack,
  onNavigate,
}: DirectorPageBuilderPageProps) => {
  const pageBuilder = useDirectorPageBuilder({ pageId, targetPath, onNavigate, userId });

  return (
    <PageBuilderWorkspace
      {...pageBuilder}
      onBack={onBack}
      onNavigate={onNavigate}
    />
  );
};
