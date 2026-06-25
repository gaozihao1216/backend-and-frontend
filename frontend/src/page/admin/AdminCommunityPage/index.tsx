import { useEffect, useState } from "react";
import type { Comment } from "../../../objects/api/api-contracts.js";
import { deleteComment, getAdminComments } from "../../../system/api/exports/index.js";
import { AdminCommunityHeader } from "./components/AdminCommunityHeader.js";
import type { AdminCommunityPageProps } from "./objects/admin-community-page-types.js";

export const AdminCommunityPage = ({ nickname, userId }: AdminCommunityPageProps) => {
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

  return (
    <section className="panel">
      <AdminCommunityHeader commentCount={comments.length} />

      <button type="button" className="secondary" onClick={() => void loadComments()} disabled={loading}>
        {loading ? "刷新中..." : "刷新评论列表"}
      </button>

      {message ? <p className="feedback success">{message}</p> : null}
      {error ? <p className="feedback error">{error}</p> : null}

      <div className="feature-grid admin-community-grid">
        <section className="feature-card">
          <h3>处理概况</h3>
          <div className="feature-metrics">
            <article className="metric-card">
              <strong>{comments.length}</strong>
              <span>当前评论</span>
            </article>
            <article className="metric-card">
              <strong>{new Set(comments.map((comment) => comment.levelId)).size}</strong>
              <span>涉及关卡</span>
            </article>
            <article className="metric-card">
              <strong>{new Set(comments.map((comment) => comment.userId)).size}</strong>
              <span>评论玩家</span>
            </article>
          </div>
        </section>

        <section className="feature-card">
          <h3>评论列表</h3>
          <div className="feature-stack">
            {comments.length === 0 && !loading ? <p>当前没有玩家评论。</p> : null}
            {comments.map((comment) => (
              <article key={comment.id} className="mini-card">
                <div className="mini-card-header">
                  <strong>{comment.userId}</strong>
                  <span>{new Date(comment.createdAt).toLocaleString("zh-CN")}</span>
                </div>
                <p>{comment.content}</p>
                <p className="meta">
                  Comment ID: {comment.id} · Level ID: {comment.levelId}
                </p>
                <div className="actions">
                  <button type="button" onClick={() => void handleDelete(comment.id)}>
                    删除评论
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
};
