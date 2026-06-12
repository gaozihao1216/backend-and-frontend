import { ButtonDesignWorkspace } from "../../../component/director-page/ButtonDesignWorkspace.js";
import { useDirectorButtonDesign } from "../../../hook/director-page/useDirectorButtonDesign.js";
import type { DirectorButtonDesignPageProps } from "../../../objects/director-page/button-design-types.js";

export const DirectorButtonDesignPage = ({
  userId,
  pageId,
  componentId,
  onBack,
}: DirectorButtonDesignPageProps) => {
  const design = useDirectorButtonDesign(userId, pageId, componentId);

  return (
    <section className="button-design-shell">
      <ButtonDesignWorkspace design={design} onBack={onBack} />
    </section>
  );
};
