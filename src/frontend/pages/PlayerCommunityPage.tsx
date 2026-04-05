import { useEffect, useState } from "react";
import type { Comment, Level } from "../../shared/types.js";
import { createComment, getLevelComments, getPublishedLevels } from "../lib/api.js";

type PlayerCommunityPageProps = {
  nickname: string;
  userId: string;
};

export const PlayerCommunityPage = ({ nickname, userId }: PlayerCommunityPageProps) => {
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

  const selectedLevel = levels.find((level) => level.id === selectedLevelId);

  return (
    <section className="panel player-community-panel">
      <div className="feature-header">
        <div>
          <h2>社区大厅</h2>
          <p className="panel-copy">围绕已发布关卡交流打法、反馈体验，并沉淀玩家评价。</p>
        </div>
        <div className="feature-pill">玩家社区</div>
      </div>

      <div className="feature-grid">
        <section className="feature-card">
          <h3>发布评论</h3>
          <button type="button" className="secondary" onClick={() => void loadLevels()} disabled={loadingLevels}>
            {loadingLevels ? "刷新中..." : "刷新关卡列表"}
          </button>
          <label>
            <span>选择关卡</span>
            <select
              value={selectedLevelId}
              onChange={(event) => setSelectedLevelId(event.target.value)}
              disabled={levels.length === 0 || loadingLevels}
            >
              {levels.length === 0 ? <option value="">暂无已发布关卡</option> : null}
              {levels.map((level) => (
                <option key={level.id} value={level.id}>
                  {level.title}
                </option>
              ))}
            </select>
          </label>
          {selectedLevel ? (
            <article className="mini-card">
              <div className="mini-card-header">
                <strong>{selectedLevel.title}</strong>
                <span>
                  {selectedLevel.averageRating.toFixed(1)} / 5
                </span>
              </div>
              <p>{selectedLevel.description || "暂无关卡描述"}</p>
              <p className="meta">Level ID: {selectedLevel.id}</p>
            </article>
          ) : null}
          <label>
            <span>评论内容</span>
            <textarea
              rows={5}
              value={draftContent}
              onChange={(event) => setDraftContent(event.target.value)}
              placeholder="写下你的通关心得、平衡性反馈或改进建议"
            />
          </label>
          <button type="button" onClick={() => void handlePublish()} disabled={!selectedLevelId}>
            发布评论
          </button>
          {message ? <p className="feedback success">{message}</p> : null}
          {error ? <p className="feedback error">{error}</p> : null}
        </section>

        <section className="feature-card">
          <h3>关卡评论流</h3>
          <button
            type="button"
            className="secondary"
            onClick={() => void loadComments(selectedLevelId)}
            disabled={!selectedLevelId || loadingComments}
          >
            {loadingComments ? "刷新中..." : "刷新评论"}
          </button>
          <div className="feature-stack">
            {comments.length === 0 && !loadingComments ? <p>当前关卡还没有评论。</p> : null}
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
              </article>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
};
