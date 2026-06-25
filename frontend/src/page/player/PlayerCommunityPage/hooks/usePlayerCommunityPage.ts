import { useEffect, useState } from "react";
import type { Comment, Level } from "../../../../objects/api/api-contracts.js";
import { createComment, getLevelComments, getPublishedLevels } from "../../../../system/api/exports/index.js";

export const usePlayerCommunityPage = (nickname: string, userId: string) => {
  const [levels, setLevels] = useState<Level[]>([]);
  const [selectedLevelId, setSelectedLevelId] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [draftContent, setDraftContent] = useState("");
  const [loadingLevels, setLoadingLevels] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadLevels = async () => {
    setLoadingLevels(true);
    setError("");

    try {
      const published = await getPublishedLevels(userId);
      setLevels(published);

      if (published.length > 0) {
        setSelectedLevelId((current) =>
          current && published.some((level) => level.id === current) ? current : published[0]?.id ?? "",
        );
      } else {
        setSelectedLevelId("");
        setComments([]);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "加载关卡失败");
    } finally {
      setLoadingLevels(false);
    }
  };

  const loadComments = async (levelId: string) => {
    if (!levelId) {
      setComments([]);
      return;
    }

    setLoadingComments(true);
    setError("");

    try {
      const nextComments = await getLevelComments(userId, levelId);
      setComments(nextComments);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "加载评论失败");
    } finally {
      setLoadingComments(false);
    }
  };

  useEffect(() => {
    void loadLevels();
  }, [userId]);

  useEffect(() => {
    void loadComments(selectedLevelId);
  }, [selectedLevelId]);

  const handlePublish = async () => {
    setMessage("");
    setError("");

    const content = draftContent.trim();
    if (!selectedLevelId) {
      setError("当前没有可评论的已发布关卡");
      return;
    }

    if (content.length < 4) {
      setError("评论内容至少 4 个字符");
      return;
    }

    try {
      await createComment(userId, selectedLevelId, {
        content,
      });
      setDraftContent("");
      setMessage(`评论已发布，发布者：${nickname}`);
      await loadComments(selectedLevelId);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "发布评论失败");
    }
  };

  return {
    levels,
    selectedLevelId,
    selectedLevel: levels.find((level) => level.id === selectedLevelId),
    comments,
    draftContent,
    loadingLevels,
    loadingComments,
    message,
    error,
    setSelectedLevelId,
    setDraftContent,
    loadLevels,
    loadComments,
    handlePublish,
  };
};
