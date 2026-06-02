import { useEffect, useState } from "react";
import {
  createComment,
  favoriteLevel,
  getFavoriteLevels,
  getLevelComments,
  getPublishedLevels,
  rateLevel,
  unfavoriteLevel,
} from "../lib/api.js";
import { LevelPreviewCard } from "../components/game/LevelPreviewCard.js";
import { API_USERS } from "../lib/config.js";
import { createPublishedLevelSource } from "../lib/level-repository.js";
import { STARTER_LEVEL_ID } from "../lib/level-contracts.js";
import type {
  Comment,
  FavoriteWithLevel,
  Level,
  RatingValue,
} from "../lib/api/api-contracts.js";
import type { LevelTag, PublishedLevelsSort } from "../lib/level-contracts.js";

const availableTags: LevelTag[] = ["puzzle", "hard", "beginner", "funny", "strategy"];
const availableSorts: PublishedLevelsSort[] = ["newest", "highestRated", "mostRated"];

type PlayerPageProps = {
  userId?: string;
};

export const PlayerPage = ({ userId = API_USERS.player.id }: PlayerPageProps) => {
  const [levels, setLevels] = useState<Level[]>([]);
  const [favoriteLevels, setFavoriteLevels] = useState<FavoriteWithLevel[]>([]);
  const [selectedTag, setSelectedTag] = useState<LevelTag | "all">("all");
  const [selectedSort, setSelectedSort] = useState<PublishedLevelsSort>("newest");
  const [scores, setScores] = useState<Record<string, RatingValue>>({});
  const [commentsByLevel, setCommentsByLevel] = useState<Record<string, Comment[]>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadComments = async (levelIds: string[]) => {
    const entries = await Promise.all(
      levelIds.map(async (levelId) => [levelId, await getLevelComments(userId, levelId)] as const),
    );
    setCommentsByLevel(Object.fromEntries(entries));
  };

  const loadLevels = async () => {
    setLoading(true);
    setError("");

    try {
      const publishedLevelsOptions = {
        ...(selectedTag === "all" ? {} : { tag: selectedTag }),
        sort: selectedSort,
      };
      const [published, favorites] = await Promise.all([
        getPublishedLevels(userId, publishedLevelsOptions),
        getFavoriteLevels(userId),
      ]);
      setLevels(published);
      setFavoriteLevels(favorites);
      if (published.length === 0) {
        setCommentsByLevel({});
      } else {
        await loadComments(published.map((level) => level.id));
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to load levels");
    } finally {
      setLoading(false);
    }
  };

  const favoriteLevelIds = new Set(favoriteLevels.map((favorite) => favorite.levelId));

  useEffect(() => {
    void loadLevels();
  }, [userId, selectedTag, selectedSort]);

  const handleRate = async (levelId: string) => {
    setError("");
    setMessage("");

    try {
      const score = scores[levelId] ?? 5;
      await rateLevel(userId, levelId, { score });
      setMessage(`Rated ${levelId} with ${score} stars`);
      await loadLevels();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to submit rating");
    }
  };

  const handleCommentSubmit = async (levelId: string) => {
    setError("");
    setMessage("");

    const content = commentDrafts[levelId]?.trim() ?? "";
    if (!content) {
      setError("Comment cannot be empty");
      return;
    }

    try {
      await createComment(userId, levelId, { content });
      setCommentDrafts((current) => ({
        ...current,
        [levelId]: "",
      }));
      setMessage(`Comment posted for ${levelId}`);
      await loadComments([levelId]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to submit comment");
    }
  };

  const handleFavoriteToggle = async (level: Level) => {
    setError("");
    setMessage("");

    try {
      if (favoriteLevelIds.has(level.id)) {
        await unfavoriteLevel(userId, level.id);
        setMessage(`Removed ${level.id} from favorites`);
      } else {
        await favoriteLevel(userId, level.id);
        setMessage(`Added ${level.id} to favorites`);
      }
      const favorites = await getFavoriteLevels(userId);
      setFavoriteLevels(favorites);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to update favorite");
    }
  };

  return (
    <section className="panel">
      <h2>Player</h2>
      <p className="panel-copy">Browse published levels, rate them, discuss them, and keep a favorites list.</p>

      <label>
        <span>Filter By Tag</span>
        <select
          value={selectedTag}
          onChange={(event) => setSelectedTag(event.target.value as LevelTag | "all")}
        >
          <option value="all">all</option>
          {availableTags.map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span>Sort By</span>
        <select
          value={selectedSort}
          onChange={(event) => setSelectedSort(event.target.value as PublishedLevelsSort)}
        >
          {availableSorts.map((sort) => (
            <option key={sort} value={sort}>
              {sort}
            </option>
          ))}
        </select>
      </label>

      <button type="button" onClick={() => void loadLevels()} disabled={loading}>
        {loading ? "Refreshing..." : "Refresh Published Levels"}
      </button>

      {message ? <p className="feedback success">{message}</p> : null}
      {error ? <p className="feedback error">{error}</p> : null}

      <div className="list">
        {levels.length === 0 && !loading ? <p>No published levels yet.</p> : null}
        {levels.map((level) => (
          <article key={level.id} className="card">
            <div className="card-header">
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
            <LevelPreviewCard source={createPublishedLevelSource(level)} defaultOpen={level.id === STARTER_LEVEL_ID} />
            <label>
              <span>Score</span>
              <select
                value={scores[level.id] ?? 5}
                onChange={(event) =>
                  setScores((current) => ({
                    ...current,
                    [level.id]: Number(event.target.value) as RatingValue,
                  }))
                }
              >
                {[1, 2, 3, 4, 5].map((score) => (
                  <option key={score} value={score}>
                    {score}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" onClick={() => void handleRate(level.id)}>
              Submit Rating
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => void handleFavoriteToggle(level)}
            >
              {favoriteLevelIds.has(level.id) ? "Remove Favorite" : "Add Favorite"}
            </button>
            <section className="comment-section">
              <div className="card-header">
                <strong>Comments</strong>
                <span>{commentsByLevel[level.id]?.length ?? 0}</span>
              </div>
              <label className="comment-form">
                <span>Add a comment</span>
                <textarea
                  rows={3}
                  value={commentDrafts[level.id] ?? ""}
                  onChange={(event) =>
                    setCommentDrafts((current) => ({
                      ...current,
                      [level.id]: event.target.value,
                    }))
                  }
                  placeholder="Share your feedback on this level"
                />
              </label>
              <div className="actions">
                <button type="button" onClick={() => void handleCommentSubmit(level.id)}>
                  Post Comment
                </button>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => void loadComments([level.id])}
                >
                  Refresh Comments
                </button>
              </div>
              <div className="comment-list">
                {(commentsByLevel[level.id] ?? []).length === 0 ? <p>No comments yet.</p> : null}
                {(commentsByLevel[level.id] ?? []).map((comment) => (
                  <article key={comment.id} className="mini-card">
                    <div className="mini-card-header">
                      <strong>{comment.userId}</strong>
                      <span>{new Date(comment.createdAt).toLocaleString()}</span>
                    </div>
                    <p>{comment.content}</p>
                    <p className="meta">
                      Comment ID: {comment.id} · Level ID: {comment.levelId}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          </article>
        ))}
      </div>

      <section className="comment-section">
        <div className="card-header">
          <strong>My Favorites</strong>
          <span>{favoriteLevels.length}</span>
        </div>
        <div className="comment-list">
          {favoriteLevels.length === 0 && !loading ? <p>No favorite levels yet.</p> : null}
          {favoriteLevels.map((favorite) => (
            <article key={favorite.id} className="mini-card">
              <div className="mini-card-header">
                <strong>{favorite.level.title}</strong>
                <span>
                  {favorite.level.averageRating.toFixed(1)} / 5 ({favorite.level.ratingCount})
                </span>
              </div>
              <p>{favorite.level.description || "No description"}</p>
              <div className="tag-list">
                {favorite.level.tags.map((tag) => (
                  <span key={tag} className="tag-chip">
                    {tag}
                  </span>
                ))}
              </div>
              <p className="meta">Level ID: {favorite.levelId}</p>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
};
