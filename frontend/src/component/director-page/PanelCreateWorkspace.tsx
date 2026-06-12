import type { DirectorPanelCreateViewModel } from "../../hook/director-page/useDirectorPanelCreate.js";
import { PanelCreateBasicStep } from "./panel-create/PanelCreateBasicStep.js";
import { PanelCreateBeautyStep } from "./panel-create/PanelCreateBeautyStep.js";
import { PanelCreateRewardConfigStep } from "./panel-create/PanelCreateRewardConfigStep.js";
import { PanelCreateButtonDesignStep } from "./panel-create/PanelCreateButtonDesignStep.js";

type PanelCreateWorkspaceProps = {
  vm: DirectorPanelCreateViewModel;
  onBack: () => void;
};

export const PanelCreateWorkspace = ({ vm, onBack }: PanelCreateWorkspaceProps) => {
  const {
    pageId,
    pageConfig,
    step,
    setStep,
    isCheckInPreset,
    selectedParentPanel,
    handleSave,
    feedback,
    templatesError,
    templatesLoading,
    panelPickerOpen,
    setPanelPickerOpen,
    availablePanels,
    selectedParentPanelId,
    setSelectedParentPanelId,
    getPanelDisplayName,
  } = vm;

  return (
    <>
      <div className="page-builder-toolbar">
        <div>
          <p className="eyebrow">Panel Create</p>
          <h2>创建小面板</h2>
          <p className="panel-copy">先确定父界面和相对位置，再配置面板装饰、特效和按钮状态界面。</p>
        </div>
        <div className="actions">
          <button type="button" className="secondary" onClick={onBack}>
            返回页面优化
          </button>
          {step === "beauty" ? (
            <button type="button" className="secondary" onClick={() => setStep("basic")}>
              返回基础数据
            </button>
          ) : null}
          {step === "rewardConfig" ? (
            <button type="button" className="secondary" onClick={() => setStep("beauty")}>
              返回美化信息
            </button>
          ) : null}
          {step === "buttonDesign" ? (
            <button type="button" className="secondary" onClick={() => setStep(isCheckInPreset ? "rewardConfig" : "beauty")}>
              返回{isCheckInPreset ? "奖励配置" : "美化信息"}
            </button>
          ) : null}
          <button
            type="button"
            disabled={!pageConfig || !selectedParentPanel}
            onClick={() => {
              if (step === "basic") {
                setStep("beauty");
                return;
              }
              if (step === "beauty") {
                setStep(isCheckInPreset ? "rewardConfig" : "buttonDesign");
                return;
              }
              if (step === "rewardConfig") {
                setStep("buttonDesign");
                return;
              }
              void handleSave();
            }}
          >
            {step === "basic"
              ? "进入美化面板"
              : step === "beauty"
                ? isCheckInPreset ? "进入奖励配置" : "进入按钮设计"
                : step === "rewardConfig"
                  ? "进入按钮设计"
                  : "创建小面板"}
          </button>
        </div>
      </div>

      {!pageId ? <p className="feedback error">缺少 pageId，无法创建小面板。</p> : null}
      {pageId && !pageConfig ? <p className="feedback error">该页面配置不存在。</p> : null}
      {feedback ? <p className="feedback">{feedback}</p> : null}
      {templatesError ? <p className="feedback error">{templatesError}</p> : null}
      {templatesLoading ? <p className="meta">正在加载模板库…</p> : null}

      {pageConfig ? (
        <>
          <div className="panel-create-step-tabs" aria-label="创建阶段">
            <span className={step === "basic" ? "active" : ""}>1 基础数据</span>
            <span className={step === "beauty" ? "active" : ""}>2 美化信息</span>
            {isCheckInPreset ? <span className={step === "rewardConfig" ? "active" : ""}>3 奖励配置</span> : null}
            <span className={step === "buttonDesign" ? "active" : ""}>{isCheckInPreset ? "4" : "3"} 按钮设计</span>
          </div>

          {step === "basic" ? (
            <PanelCreateBasicStep vm={vm} />
          ) : step === "beauty" ? (
            <PanelCreateBeautyStep vm={vm} />
          ) : step === "rewardConfig" ? (
            <PanelCreateRewardConfigStep vm={vm} />
          ) : (
            <PanelCreateButtonDesignStep vm={vm} />
          )}
        </>
      ) : null}

      {panelPickerOpen && pageConfig ? (
        <div className="page-builder-dialog-backdrop" role="presentation">
          <section className="page-builder-dialog" role="dialog" aria-modal="true" aria-label="选择父界面">
            <div className="page-builder-dialog-header">
              <div>
                <p className="eyebrow">Parent Panel</p>
                <h3>选择显示的父界面</h3>
              </div>
              <button type="button" className="secondary" onClick={() => setPanelPickerOpen(false)}>
                关闭
              </button>
            </div>
            <div className="page-builder-directory-list">
              {availablePanels.map((panel) => (
                <button
                  key={panel.id}
                  type="button"
                  className={panel.id === selectedParentPanelId ? "selected" : ""}
                  onClick={() => {
                    setSelectedParentPanelId(panel.id);
                    setPanelPickerOpen(false);
                  }}
                >
                  <span>{panel.kind === "stage" ? "关卡界面" : "界面"}</span>
                  <strong>{getPanelDisplayName(panel)}</strong>
                  <code>{panel.id}</code>
                </button>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
};
