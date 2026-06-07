import { useEffect, useMemo, useState } from "react";
import {
  getDesignerPortfolioItemById,
  formatDesignerPortfolioDate,
  DESIGNER_PORTFOLIO_STATUS_LABELS,
} from "../lib/designer-portfolio-mock.js";

type DesignerResubmitPageProps = {
  levelId: string;
  onBack: () => void;
};

export const DesignerResubmitPage = ({ levelId, onBack }: DesignerResubmitPageProps) => {
  const portfolioItem = useMemo(() => getDesignerPortfolioItemById(levelId), [levelId]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [revisionNotes, setRevisionNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setTitle(portfolioItem?.title ?? "");
    setDescription(portfolioItem?.description ?? "");
    setTagsInput(portfolioItem?.tags.join(", ") ?? "");
    setRevisionNotes("");
    setSubmitted(false);
  }, [portfolioItem]);

  if (!portfolioItem || portfolioItem.status !== "rejected") {
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

  const handleSubmit = () => {
    setSubmitted(true);
  };

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

      <article className="card designer-resubmit-summary">
        <div className="card-header">
          <strong>{portfolioItem.title}</strong>
          <span className="designer-portfolio-status-badge status-rejected">
            {DESIGNER_PORTFOLIO_STATUS_LABELS.rejected}
          </span>
        </div>
        <p className="meta">关卡 ID：{portfolioItem.id}</p>
        <p className="meta">最近更新：{formatDesignerPortfolioDate(portfolioItem.updatedAt)}</p>
        <div className="designer-portfolio-rejection">
          <strong>驳回原因</strong>
          <p>{portfolioItem.rejectionReason ?? "未提供驳回原因。"}</p>
          {portfolioItem.reviewNote ? (
            <p className="meta">审核备注：{portfolioItem.reviewNote}</p>
          ) : null}
        </div>
      </article>

      <form
        className="designer-resubmit-form"
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit();
        }}
      >
        <label>
          <span>关卡标题</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="请输入关卡标题"
          />
        </label>

        <label>
          <span>关卡描述</span>
          <textarea
            rows={4}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="简要说明玩法目标与改动点"
          />
        </label>

        <label>
          <span>标签</span>
          <input
            value={tagsInput}
            onChange={(event) => setTagsInput(event.target.value)}
            placeholder="用逗号分隔，例如：岩石, 高难度"
          />
        </label>

        <label>
          <span>本次修改说明</span>
          <textarea
            rows={4}
            value={revisionNotes}
            onChange={(event) => setRevisionNotes(event.target.value)}
            placeholder="说明针对驳回意见做了哪些调整，便于审核员快速复核"
          />
        </label>

        <div className="actions">
          <button type="submit" disabled={submitted || !title.trim() || !description.trim()}>
            {submitted ? "已记录（演示）" : "重新提交审核"}
          </button>
          <button type="button" className="secondary" onClick={onBack}>
            取消
          </button>
        </div>

        {submitted ? (
          <p className="feedback success">
            表单已填写完成（静态演示）。接入 API 后，此处会真正发起重新提交流程。
          </p>
        ) : null}
      </form>
    </section>
  );
};
