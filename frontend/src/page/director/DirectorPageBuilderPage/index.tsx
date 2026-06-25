import { PageBuilderWorkspace } from "./components/PageBuilderWorkspace.js";
import { useDirectorPageBuilder } from "./hooks/useDirectorPageBuilder.js";
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
