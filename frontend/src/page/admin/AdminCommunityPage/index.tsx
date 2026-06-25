import { AdminCommunityHeader } from "./components/AdminCommunityHeader.js";
import { useAdminCommunityPage } from "./hooks/useAdminCommunityPage.js";
import type { AdminCommunityPageProps } from "./objects/admin-community-page-types.js";

export const AdminCommunityPage = ({ nickname, userId }: AdminCommunityPageProps) => {
  const vm = useAdminCommunityPage(nickname, userId);

  return (
    <section className="panel">
      <AdminCommunityHeader commentCount={vm.comments.length} />

      <button type="button" className="secondary" onClick={() => void vm.loadComments()} disabled={vm.loading}>
        {vm.loading ? "刷新中..." : "刷新评论列表"}
      </button>

      {vm.message ? <p className="feedback success">{vm.message}</p> : null}
      {vm.error ? <p className="feedback error">{vm.error}</p> : null}

      <div className="feature-grid admin-community-grid">
        <section className="feature-card">
          <h3>处理概况</h3>
          <div className="feature-metrics">
            <article className="metric-card">
              <strong>{vm.comments.length}</strong>
              <span>当前评论</span>
            </article>
            <article className="metric-card">
              <strong>{new Set(vm.comments.map((comment) => comment.levelId)).size}</strong>
              <span>涉及关卡</span>
            </article>
            <article className="metric-card">
              <strong>{new Set(vm.comments.map((comment) => comment.userId)).size}</strong>
              <span>评论玩家</span>
            </article>
          </div>
        </section>

        <section className="feature-card">
          <h3>评论列表</h3>
          <div className="feature-stack">
            {vm.comments.length === 0 && !vm.loading ? <p>当前没有玩家评论。</p> : null}
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
                <div className="actions">
                  <button type="button" onClick={() => void vm.handleDelete(comment.id)}>
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
