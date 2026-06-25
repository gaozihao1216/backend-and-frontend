import { PlayerCommunityHeader } from "./components/PlayerCommunityHeader.js";
import { usePlayerCommunityPage } from "./hooks/usePlayerCommunityPage.js";
import type { PlayerCommunityPageProps } from "./objects/player-community-page-types.js";

export const PlayerCommunityPage = ({ nickname, userId }: PlayerCommunityPageProps) => {
  const vm = usePlayerCommunityPage(nickname, userId);

  return (
    <section className="panel player-community-panel">
      <PlayerCommunityHeader />

      <div className="feature-grid">
        <section className="feature-card">
          <h3>发布评论</h3>
          <button type="button" className="secondary" onClick={() => void vm.loadLevels()} disabled={vm.loadingLevels}>
            {vm.loadingLevels ? "刷新中..." : "刷新关卡列表"}
          </button>
          <label>
            <span>选择关卡</span>
            <select
              value={vm.selectedLevelId}
              onChange={(event) => vm.setSelectedLevelId(event.target.value)}
              disabled={vm.levels.length === 0 || vm.loadingLevels}
            >
              {vm.levels.length === 0 ? <option value="">暂无已发布关卡</option> : null}
              {vm.levels.map((level) => (
                <option key={level.id} value={level.id}>
                  {level.title}
                </option>
              ))}
            </select>
          </label>
          {vm.selectedLevel ? (
            <article className="mini-card">
              <div className="mini-card-header">
                <strong>{vm.selectedLevel.title}</strong>
                <span>
                  {vm.selectedLevel.averageRating.toFixed(1)} / 5
                </span>
              </div>
              <p>{vm.selectedLevel.description || "暂无关卡描述"}</p>
              <p className="meta">Level ID: {vm.selectedLevel.id}</p>
            </article>
          ) : null}
          <label>
            <span>评论内容</span>
            <textarea
              rows={5}
              value={vm.draftContent}
              onChange={(event) => vm.setDraftContent(event.target.value)}
              placeholder="写下你的通关心得、平衡性反馈或改进建议"
            />
          </label>
          <button type="button" onClick={() => void vm.handlePublish()} disabled={!vm.selectedLevelId}>
            发布评论
          </button>
          {vm.message ? <p className="feedback success">{vm.message}</p> : null}
          {vm.error ? <p className="feedback error">{vm.error}</p> : null}
        </section>

        <section className="feature-card">
          <h3>关卡评论流</h3>
          <button
            type="button"
            className="secondary"
            onClick={() => void vm.loadComments(vm.selectedLevelId)}
            disabled={!vm.selectedLevelId || vm.loadingComments}
          >
            {vm.loadingComments ? "刷新中..." : "刷新评论"}
          </button>
          <div className="feature-stack">
            {vm.comments.length === 0 && !vm.loadingComments ? <p>当前关卡还没有评论。</p> : null}
            {vm.comments.map((comment) => (
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
