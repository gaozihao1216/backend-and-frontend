import { PanelCreateWorkspace } from "./components/PanelCreateWorkspace.js";
import { useDirectorPanelCreate } from "./hooks/useDirectorPanelCreate.js";
import type { DirectorPanelCreatePageProps } from "../../../objects/director-page/panel-create-types.js";

export const DirectorPanelCreatePage = (props: DirectorPanelCreatePageProps) => {
  const vm = useDirectorPanelCreate(props);

  return (
    <section className="panel-create-shell">
      <PanelCreateWorkspace vm={vm} onBack={props.onBack} />
    </section>
  );
};
