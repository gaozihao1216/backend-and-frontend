import { ButtonDesignWorkspace } from "./components/ButtonDesignWorkspace.js";
import { useDirectorButtonDesign } from "./hooks/useDirectorButtonDesign.js";
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
