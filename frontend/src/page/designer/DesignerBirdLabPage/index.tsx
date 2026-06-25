import { BirdDesignForm } from "./components/BirdDesignForm.js";
import { BirdDesignList } from "./components/BirdDesignList.js";
import { BirdDesignTabs } from "./components/BirdDesignTabs.js";
import { BirdLabHeader } from "./components/BirdLabHeader.js";
import { useDesignerBirdLab } from "./hooks/useDesignerBirdLab.js";
import type { DesignerBirdLabPageProps } from "./objects/designer-bird-lab-page-types.js";

export const DesignerBirdLabPage = ({ userId, onBack }: DesignerBirdLabPageProps) => {
  const vm = useDesignerBirdLab(userId);
  const editable = vm.activeTab === "draft" || vm.activeTab === "rejected";

  return (
    <section className="panel designer-bird-lab-page">
      <BirdLabHeader onBack={onBack} />

      {vm.error ? <p className="feedback error">{vm.error}</p> : null}
      {vm.notice ? <p className="feedback success">{vm.notice}</p> : null}

      <BirdDesignTabs activeTab={vm.activeTab} setActiveTab={vm.setActiveTab} />

      {editable ? (
        <div className="designer-bird-lab-layout">
          <BirdDesignForm vm={vm} />
          <BirdDesignList vm={vm} editable />
        </div>
      ) : (
        <BirdDesignList vm={vm} editable={false} />
      )}
    </section>
  );
};
