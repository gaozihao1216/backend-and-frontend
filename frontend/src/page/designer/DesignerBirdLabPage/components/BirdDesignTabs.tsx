import {
  birdDesignTabLabels,
  type BirdDesignPortfolioTab,
} from "../objects/designer-bird-lab-page-types.js";

type BirdDesignTabsProps = {
  activeTab: BirdDesignPortfolioTab;
  setActiveTab: (tab: BirdDesignPortfolioTab) => void;
};

export const BirdDesignTabs = ({ activeTab, setActiveTab }: BirdDesignTabsProps) => (
  <div className="designer-bird-tabs" role="tablist" aria-label="鸟类设计状态">
    {(Object.keys(birdDesignTabLabels) as BirdDesignPortfolioTab[]).map((tab) => (
      <button
        key={tab}
        type="button"
        role="tab"
        aria-selected={activeTab === tab}
        className={activeTab === tab ? "secondary is-active" : "secondary"}
        onClick={() => setActiveTab(tab)}
      >
        {birdDesignTabLabels[tab]}
      </button>
    ))}
  </div>
);
