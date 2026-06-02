import { LevelPreviewCard } from "../../../components/game/LevelPreviewCard.js";
import { createPublishedLevelSource } from "../../../lib/level-repository.js";
import type { Level } from "../../../lib/api/api-contracts.js";

type CreatedLevelsPanelProps = {
  createdLevels: Level[];
  submittedIds: string[];
  onSubmitLevel: (levelId: string) => void;
};

export const CreatedLevelsPanel = ({
  createdLevels,
  submittedIds,
  onSubmitLevel,
}: CreatedLevelsPanelProps) => (
  <div className="list">
    <h3>Created In This Session</h3>
    {createdLevels.length === 0 ? <p>No levels created yet.</p> : null}
    {createdLevels.map((level) => {
      const isSubmitted = submittedIds.includes(level.id);
      return (
        <article key={level.id} className="card">
          <div className="card-header">
            <strong>{level.title}</strong>
            <span>{level.status}</span>
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
          <LevelPreviewCard source={createPublishedLevelSource(level)} />
          <button
            type="button"
            disabled={isSubmitted}
            onClick={() => onSubmitLevel(level.id)}
          >
            {isSubmitted ? "Submitted" : "Submit For Review"}
          </button>
        </article>
      );
    })}
  </div>
);
