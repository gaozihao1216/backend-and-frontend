import { useEffect, useState } from "react";
import {
  getPendingBirdSubmissions,
  getPendingSubmissions,
  reviewBirdSubmission,
  reviewSubmission,
} from "../../../../api/index.js";
import { LevelPreviewCard } from "../../../../component/level/LevelPreviewCard.js";
import { createSubmissionLevelSource } from "../../../../lib/level-repository.js";
import { STARTER_LEVEL_ID } from "../../../../shared/levels/starter-level.js";
import type { BirdSubmissionWithDesign, SubmissionWithLevel } from "../../../../api/api-contracts.js";

type ReviewTab = "levels" | "birds";

type AdminProposalReviewContentProps = {
  userId: string;
  embedded?: boolean | undefined;
};

export const AdminProposalReviewContent = ({
  userId,
  embedded = false,
}: AdminProposalReviewContentProps) => {
  const [reviewTab, setReviewTab] = useState<ReviewTab>("levels");
  const [levelSubmissions, setLevelSubmissions] = useState<SubmissionWithLevel[]>([]);
  const [birdSubmissions, setBirdSubmissions] = useState<BirdSubmissionWithDesign[]>([]);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadPending = async () => {
    setLoading(true);
    setError("");

    try {
      if (reviewTab === "levels") {
        setLevelSubmissions(await getPendingSubmissions(userId));
      } else {
        setBirdSubmissions(await getPendingBirdSubmissions(userId));
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "加载待审核提案失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPending();
  }, [reviewTab, userId]);

  const handleReviewLevel = async (submissionId: string, status: "approved" | "rejected") => {
    setError("");
    try {
      const reviewNote = reviewNotes[submissionId]?.trim();
      await reviewSubmission(userId, submissionId, {
        status,
        ...(reviewNote ? { reviewNote } : {}),
      });
      await loadPending();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "关卡审核失败");
    }
  };

  const handleReviewBird = async (submissionId: string, status: "approved" | "rejected") => {
    setError("");
    try {
      const reviewNote = reviewNotes[submissionId]?.trim();
      await reviewBirdSubmission(userId, submissionId, {
        status,
        ...(reviewNote ? { reviewNote } : {}),
      });
      await loadPending();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "鸟类审核失败");
    }
  };

  return (
    <div className={embedded ? "admin-review-widget" : "admin-review-content"}>
      <div className="admin-review-tabs">
        <button
          type="button"
          className={reviewTab === "levels" ? "secondary is-active" : "secondary"}
          onClick={() => setReviewTab("levels")}
        >
          关卡提案
        </button>
        <button
          type="button"
          className={reviewTab === "birds" ? "secondary is-active" : "secondary"}
          onClick={() => setReviewTab("birds")}
        >
          鸟类提案
        </button>
      </div>

      <button type="button" onClick={() => void loadPending()} disabled={loading}>
        {loading ? "刷新中…" : "刷新待审核"}
      </button>

      {error ? <p className="feedback error">{error}</p> : null}

      {reviewTab === "levels" ? (
        <div className="list">
          {levelSubmissions.length === 0 && !loading ? <p>暂无待审核关卡。</p> : null}
          {levelSubmissions.map((submission) => (
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
                  value={reviewNotes[submission.id] ?? ""}
                  onChange={(event) =>
                    setReviewNotes((current) => ({
                      ...current,
                      [submission.id]: event.target.value,
                    }))
                  }
                />
              </label>
              <div className="actions">
                <button type="button" onClick={() => void handleReviewLevel(submission.id, "approved")}>
                  通过
                </button>
                <button type="button" className="secondary" onClick={() => void handleReviewLevel(submission.id, "rejected")}>
                  驳回
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="list">
          {birdSubmissions.length === 0 && !loading ? <p>暂无待审核鸟类提案。</p> : null}
          {birdSubmissions.map((submission) => (
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
                  value={reviewNotes[submission.id] ?? ""}
                  onChange={(event) =>
                    setReviewNotes((current) => ({
                      ...current,
                      [submission.id]: event.target.value,
                    }))
                  }
                />
              </label>
              <div className="actions">
                <button type="button" onClick={() => void handleReviewBird(submission.id, "approved")}>
                  通过
                </button>
                <button type="button" className="secondary" onClick={() => void handleReviewBird(submission.id, "rejected")}>
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
