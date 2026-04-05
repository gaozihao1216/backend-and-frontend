import { useState } from "react";
import { createDefaultLevelInput, createLevel, parseLevelDataInput, submitLevel } from "../lib/api.js";
import { API_USERS } from "../lib/config.js";
import type { Level, LevelTag, Submission } from "../../shared/types.js";

const initialForm = createDefaultLevelInput();
const availableTags: LevelTag[] = ["puzzle", "hard", "beginner", "funny", "strategy"];

type DesignerPageProps = {
  userId?: string;
};

export const DesignerPage = ({ userId = API_USERS.designer.id }: DesignerPageProps) => {
  const [title, setTitle] = useState(initialForm.title);
  const [description, setDescription] = useState(initialForm.description ?? "");
  const [selectedTags, setSelectedTags] = useState<LevelTag[]>(initialForm.tags);
  const [dataText, setDataText] = useState(JSON.stringify(initialForm.data, null, 2));
  const [createdLevels, setCreatedLevels] = useState<Level[]>([]);
  const [submittedIds, setSubmittedIds] = useState<string[]>([]);
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleCreate = async () => {
    setError("");
    setMessage("");

    try {
      const data = parseLevelDataInput(dataText);
      const level = await createLevel(userId, {
        title,
        description,
        tags: selectedTags,
        data,
      });
      setCreatedLevels((current) => [level, ...current]);
      setMessage(`Created level ${level.id}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to create level");
    }
  };

  const toggleTag = (tag: LevelTag) => {
    setSelectedTags((current) =>
      current.includes(tag) ? current.filter((candidate) => candidate !== tag) : [...current, tag],
    );
  };

  const handleSubmit = async (levelId: string) => {
    setError("");
    setMessage("");

    try {
      const submission: Submission = await submitLevel(userId, levelId);
      setSubmittedIds((current) => [...current, submission.levelId]);
      setMessage(`Submitted ${submission.levelId} for review`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to submit level");
    }
  };

  return (
    <section className="panel">
      <h2>Designer</h2>
      <p className="panel-copy">Create a simple level payload and submit it for admin review.</p>

      <label>
        <span>Title</span>
        <input value={title} onChange={(event) => setTitle(event.target.value)} />
      </label>

      <label>
        <span>Description</span>
        <textarea
          rows={3}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </label>

      <fieldset className="tag-picker">
        <legend>Tags</legend>
        <div className="tag-list">
          {availableTags.map((tag) => (
            <label key={tag} className="tag-option">
              <input
                type="checkbox"
                checked={selectedTags.includes(tag)}
                onChange={() => toggleTag(tag)}
              />
              <span>{tag}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <label>
        <span>Level Data JSON</span>
        <textarea
          rows={18}
          value={dataText}
          onChange={(event) => setDataText(event.target.value)}
        />
      </label>

      <button type="button" onClick={handleCreate}>
        Create Level
      </button>

      {message ? <p className="feedback success">{message}</p> : null}
      {error ? <p className="feedback error">{error}</p> : null}

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
              <button
                type="button"
                disabled={isSubmitted}
                onClick={() => handleSubmit(level.id)}
              >
                {isSubmitted ? "Submitted" : "Submit For Review"}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
};
