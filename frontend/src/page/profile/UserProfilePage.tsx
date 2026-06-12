import { useEffect, useState } from "react";
import type { UserProfile } from "../../api/api-contracts.js";
import { getUserProfile } from "../../api/index.js";
import type { AdminLevel } from "../../objects/system/system-objects.js";

type UserProfilePageProps = {
  viewerUserId: string;
  profileUserId: string;
};

const adminLevelLabels = {
  standard: "普通管理员",
  director: "总监管理员",
} as const;

const getAdminLevelLabel = (adminLevel: AdminLevel) => adminLevelLabels[adminLevel];

export const UserProfilePage = ({ viewerUserId, profileUserId }: UserProfilePageProps) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadProfile = async () => {
    setLoading(true);
    setError("");

    try {
      const nextProfile = await getUserProfile(viewerUserId, profileUserId);
      setProfile(nextProfile);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProfile();
  }, [viewerUserId, profileUserId]);

  return (
    <section className="panel">
      <div className="feature-header">
        <div>
          <h2>User Profile</h2>
          <p className="panel-copy">View published levels, recent comments, and lightweight activity stats.</p>
        </div>
        <button type="button" className="secondary" onClick={() => void loadProfile()} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh Profile"}
        </button>
      </div>

      {error ? <p className="feedback error">{error}</p> : null}

      {profile ? (
        <div className="feature-grid">
          <section className="feature-card">
            <h3>{profile.user.displayName}</h3>
            <p className="meta">
              @{profile.user.username} · {profile.user.role}
            </p>
            {profile.user.role === "admin" && profile.user.adminLevel ? (
              <p className="meta">管理员权限：{getAdminLevelLabel(profile.user.adminLevel)}</p>
            ) : null}
            <div className="feature-metrics">
              <article className="metric-card">
                <strong>{profile.publishedLevels.length}</strong>
                <span>Published Levels</span>
              </article>
              <article className="metric-card">
                <strong>{profile.stats.favoriteCount}</strong>
                <span>Favorites</span>
              </article>
              <article className="metric-card">
                <strong>{profile.stats.ratingCount}</strong>
                <span>Ratings</span>
              </article>
            </div>
          </section>

          <section className="feature-card">
            <h3>Published Levels</h3>
            <div className="feature-stack">
              {profile.publishedLevels.length === 0 ? <p>No published levels yet.</p> : null}
              {profile.publishedLevels.map((level) => (
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
              {profile.recentComments.length === 0 ? <p>No comments yet.</p> : null}
              {profile.recentComments.map((comment) => (
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
