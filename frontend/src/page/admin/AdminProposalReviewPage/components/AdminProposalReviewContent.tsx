import { LevelPreviewCard } from "../../../../components/level/LevelPreviewCard.js";
import { createSubmissionLevelSource } from "../../../../lib/level-repository.js";
import { STARTER_LEVEL_ID } from "../../../../shared/levels/starter-level.js";
import { useAdminProposalReviewPage } from "../hooks/useAdminProposalReviewPage.js";

type AdminProposalReviewContentProps = {
  userId: string;
  embedded?: boolean | undefined;
};

export const AdminProposalReviewContent = ({
  userId,
  embedded = false,
}: AdminProposalReviewContentProps) => {
  const vm = useAdminProposalReviewPage(userId);

  return (
    <div className={embedded ? "admin-review-widget" : "admin-review-content"}>
      <div className="admin-review-tabs">
        <button
          type="button"
          className={vm.reviewTab === "levels" ? "secondary is-active" : "secondary"}
          onClick={() => vm.setReviewTab("levels")}
        >
          关卡提案
        </button>
        <button
          type="button"
          className={vm.reviewTab === "birds" ? "secondary is-active" : "secondary"}
          onClick={() => vm.setReviewTab("birds")}
        >
          鸟类提案
        </button>
      </div>

      <button type="button" onClick={() => void vm.loadPending()} disabled={vm.loading}>
        {vm.loading ? "刷新中…" : "刷新待审核"}
      </button>

      {vm.error ? <p className="feedback error">{vm.error}</p> : null}

      {vm.reviewTab === "levels" ? (
        <div className="list">
          {vm.levelSubmissions.length === 0 && !vm.loading ? <p>暂无待审核关卡。</p> : null}
          {vm.levelSubmissions.map((submission) => (
            <article key={submission.id} className="card">
              <div className="card-header">
                <strong>{submission.id}</strong>
                <span>{submission.status}</span>
              </div>
              <p className="meta">Level ID: {submission.levelId}</p>
              <p className="meta">Submitter ID: {submission.submitterId}</p>
              <LevelPreviewCard
                source={createSubmissionLevelSource(submission.level)}
                defaultOpen={submission.levelId === STARTER_LEVEL_ID}
              />
              <label>
                <span>审核备注</span>
                <textarea
                  rows={3}
                  value={vm.reviewNotes[submission.id] ?? ""}
                  onChange={(event) => vm.setReviewNote(submission.id, event.target.value)}
                />
              </label>
              <div className="actions">
                <button type="button" onClick={() => void vm.handleReviewLevel(submission.id, "approved")}>
                  通过
                </button>
                <button type="button" className="secondary" onClick={() => void vm.handleReviewLevel(submission.id, "rejected")}>
                  驳回
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="list">
          {vm.birdSubmissions.length === 0 && !vm.loading ? <p>暂无待审核鸟类提案。</p> : null}
          {vm.birdSubmissions.map((submission) => (
            <article key={submission.id} className="card admin-bird-review-card">
              <div className="card-header">
                <strong>{submission.design.name}</strong>
                <span>{submission.status}</span>
              </div>
              <p className="meta">Submission ID: {submission.id}</p>
              <p className="meta">Designer ID: {submission.submitterId}</p>
              <div className="admin-bird-review-layout">
                <img src={submission.design.previewImageUrl} alt={submission.design.name} />
                <div>
                  <p>{submission.design.summary}</p>
                  <p className="meta">
                    攻击 {submission.design.attack} / 冲击 {submission.design.impact} / 速度 {submission.design.speed}
                  </p>
                  <p><strong>{submission.design.skillName}</strong></p>
                  <ul className="designer-bird-tier-list">
                    {submission.design.tierSkills.map((skill, index) => (
                      <li key={index}>{index + 1} 阶：{skill}</li>
                    ))}
                  </ul>
                  {submission.design.mechanismTags.length > 0 ? (
                    <p className="meta">机制标签：{submission.design.mechanismTags.join("、")}</p>
                  ) : null}
                </div>
              </div>
              <label>
                <span>审核备注</span>
                <textarea
                  rows={3}
                  value={vm.reviewNotes[submission.id] ?? ""}
                  onChange={(event) => vm.setReviewNote(submission.id, event.target.value)}
                />
              </label>
              <div className="actions">
                <button type="button" onClick={() => void vm.handleReviewBird(submission.id, "approved")}>
                  通过
                </button>
                <button type="button" className="secondary" onClick={() => void vm.handleReviewBird(submission.id, "rejected")}>
                  驳回
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
