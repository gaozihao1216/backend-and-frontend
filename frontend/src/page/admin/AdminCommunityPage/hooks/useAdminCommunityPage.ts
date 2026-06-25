import { useEffect, useState } from "react";
import type { Comment } from "../../../../objects/api/api-contracts.js";
import { deleteComment, getAdminComments } from "../../../../system/api/exports/index.js";

export const useAdminCommunityPage = (nickname: string, userId: string) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadComments = async () => {
    setLoading(true);
    setError("");

    try {
      const nextComments = await getAdminComments(userId);
      setComments(nextComments);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "加载评论失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadComments();
  }, [userId]);

  const handleDelete = async (commentId: string) => {
    setError("");
    setMessage("");

    try {
      await deleteComment(userId, commentId);
      setMessage(`${nickname} 已删除评论 ${commentId}`);
      await loadComments();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "删除评论失败");
    }
  };

  return {
    comments,
    loading,
    message,
    error,
    loadComments,
    handleDelete,
  };
};
