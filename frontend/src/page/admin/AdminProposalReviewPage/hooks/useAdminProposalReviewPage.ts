import { useEffect, useState } from "react";
import type { BirdSubmissionWithDesign, SubmissionWithLevel } from "../../../../objects/api/api-contracts.js";
import {
  getPendingBirdSubmissions,
  getPendingSubmissions,
  reviewBirdSubmission,
  reviewSubmission,
} from "../../../../system/api/exports/index.js";

export type ReviewTab = "levels" | "birds";

export const useAdminProposalReviewPage = (userId: string) => {
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

  const setReviewNote = (submissionId: string, reviewNote: string) => {
    setReviewNotes((current) => ({
      ...current,
      [submissionId]: reviewNote,
    }));
  };

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

  return {
    reviewTab,
    levelSubmissions,
    birdSubmissions,
    reviewNotes,
    loading,
    error,
    setReviewTab,
    setReviewNote,
    loadPending,
    handleReviewLevel,
    handleReviewBird,
  };
};
