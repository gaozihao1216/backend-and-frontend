import type { AdminLevel } from "../../../objects/system/system-objects.js";
import { UserProfileHeader } from "./components/UserProfileHeader.js";
import { useUserProfilePage } from "./hooks/useUserProfilePage.js";
import type { UserProfilePageProps } from "./objects/user-profile-page-types.js";

const adminLevelLabels = {
  standard: "普通管理员",
  director: "总监管理员",
} as const;

const getAdminLevelLabel = (adminLevel: AdminLevel) => adminLevelLabels[adminLevel];

export const UserProfilePage = ({ viewerUserId, profileUserId }: UserProfilePageProps) => {
  const vm = useUserProfilePage(viewerUserId, profileUserId);

  return (
    <section className="panel">
      <UserProfileHeader loading={vm.loading} onRefresh={() => void vm.loadProfile()} />

      {vm.error ? <p className="feedback error">{vm.error}</p> : null}

      {vm.profile ? (
        <div className="feature-grid">
          <section className="feature-card">
            <h3>{vm.profile.user.displayName}</h3>
            <p className="meta">
              @{vm.profile.user.username} · {vm.profile.user.role}
            </p>
            {vm.profile.user.role === "admin" && vm.profile.user.adminLevel ? (
              <p className="meta">管理员权限：{getAdminLevelLabel(vm.profile.user.adminLevel)}</p>
            ) : null}
            <div className="feature-metrics">
              <article className="metric-card">
                <strong>{vm.profile.publishedLevels.length}</strong>
                <span>Published Levels</span>
              </article>
              <article className="metric-card">
                <strong>{vm.profile.stats.favoriteCount}</strong>
                <span>Favorites</span>
              </article>
              <article className="metric-card">
                <strong>{vm.profile.stats.ratingCount}</strong>
                <span>Ratings</span>
              </article>
            </div>
          </section>

          <section className="feature-card">
            <h3>Published Levels</h3>
            <div className="feature-stack">
              {vm.profile.publishedLevels.length === 0 ? <p>No published levels yet.</p> : null}
              {vm.profile.publishedLevels.map((level) => (
                <article key={level.id} className="mini-card">
                  <div className="mini-card-header">
                    <strong>{level.title}</strong>
                    <span>
                      {level.averageRating.toFixed(1)} / 5 ({level.ratingCount})
                    </span>
                  </div>
                  <p>{level.description || "No description"}</p>
                  <div className="tag-list">
                    {level.tags.map((tag) => (
                      <span key={tag} className="tag-chip">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <p className="meta">Level ID: {level.id}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="feature-card">
            <h3>Recent Comments</h3>
            <div className="feature-stack">
              {vm.profile.recentComments.length === 0 ? <p>No comments yet.</p> : null}
              {vm.profile.recentComments.map((comment) => (
                <article key={comment.id} className="mini-card">
                  <div className="mini-card-header">
                    <strong>{comment.levelId}</strong>
                    <span>{new Date(comment.createdAt).toLocaleString()}</span>
                  </div>
                  <p>{comment.content}</p>
                  <p className="meta">Comment ID: {comment.id}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
};
