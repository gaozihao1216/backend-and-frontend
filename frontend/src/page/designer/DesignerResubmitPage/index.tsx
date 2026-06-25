import { ResubmitForm } from "./components/ResubmitForm.js";
import { ResubmitSummary } from "./components/ResubmitSummary.js";
import { useDesignerResubmit } from "./hooks/useDesignerResubmit.js";
import type { DesignerResubmitPageProps } from "./objects/designer-resubmit-page-types.js";

export const DesignerResubmitPage = ({ levelId, onBack }: DesignerResubmitPageProps) => {
  const vm = useDesignerResubmit(levelId);

  if (!vm.portfolioItem || vm.portfolioItem.status !== "rejected") {
    return (
      <section className="panel designer-resubmit-panel">
        <div className="designer-portfolio-header">
          <div>
            <h2>重新提交关卡</h2>
            <p className="panel-copy">未找到可重新提交的驳回关卡，请从作品集进入。</p>
          </div>
          <button type="button" className="secondary" onClick={onBack}>
            返回作品集
          </button>
        </div>
        {levelId ? <p className="meta">请求的关卡 ID：{levelId}</p> : null}
      </section>
    );
  }

  return (
    <section className="panel designer-resubmit-panel">
      <div className="designer-portfolio-header">
        <div>
          <h2>重新提交关卡</h2>
          <p className="panel-copy">
            根据驳回意见修改关卡信息后再次提交审核。当前仅为表单演示，尚未接入提交 API。
          </p>
        </div>
        <button type="button" className="secondary" onClick={onBack}>
          返回作品集
        </button>
      </div>

      <ResubmitSummary portfolioItem={vm.portfolioItem} />
      <ResubmitForm vm={vm} onBack={onBack} />
    </section>
  );
};
