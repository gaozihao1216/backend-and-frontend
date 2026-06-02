import { useState } from "react";
import { createLevel, submitLevel } from "../../../lib/api.js";
import type { Level, Submission } from "../../../../lib/api/api-contracts.js";
import type { LevelData, LevelTag } from "../../../../lib/level-contracts.js";

type UseDesignerLevelSubmissionParams = {
  userId: string;
  title: string;
  description: string;
  selectedTags: LevelTag[];
  levelData: LevelData;
  isTitleMissing: boolean;
  setMessage: (message: string) => void;
  setError: (error: string) => void;
};

export const useDesignerLevelSubmission = ({
  userId,
  title,
  description,
  selectedTags,
  levelData,
  isTitleMissing,
  setMessage,
  setError,
}: UseDesignerLevelSubmissionParams) => {
  const [createdLevels, setCreatedLevels] = useState<Level[]>([]);
  const [submittedIds, setSubmittedIds] = useState<string[]>([]);

  const handleCreate = async () => {
    setError("");
    setMessage("");

    if (isTitleMissing) {
      setError("请先填写 Title，再创建关卡。");
      return;
    }

    try {
      // create 只负责保存草稿关卡，不会自动进入审核流程。
      const level = await createLevel(userId, {
        title,
        description,
        tags: selectedTags,
        data: levelData,
      });
      setCreatedLevels((current) => [level, ...current]);
      setMessage(`Created level ${level.id}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to create level");
    }
  };

  const handleSubmit = async (levelId: string) => {
    setError("");
    setMessage("");

    try {
      // submit 针对已经创建到后端的 levelId，而不是当前本地草稿。
      const submission: Submission = await submitLevel(userId, levelId);
      setSubmittedIds((current) => [...current, submission.levelId]);
      setMessage(`Submitted ${submission.levelId} for review`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to submit level");
    }
  };

  return {
    createdLevels,
    submittedIds,
    handleCreate,
    handleSubmit,
  };
};
