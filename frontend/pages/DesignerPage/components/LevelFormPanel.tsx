import type { LevelTag } from "../../../../lib/level-contracts.js";

type LevelFormPanelProps = {
  title: string;
  description: string;
  selectedTags: LevelTag[];
  availableTags: LevelTag[];
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
  onToggleTag: (tag: LevelTag) => void;
};

export const LevelFormPanel = ({
  title,
  description,
  selectedTags,
  availableTags,
  onTitleChange,
  onDescriptionChange,
  onToggleTag,
}: LevelFormPanelProps) => (
  <>
    <label>
      <span>Title</span>
      <input value={title} onChange={(event) => onTitleChange(event.target.value)} />
    </label>

    <label>
      <span>Description</span>
      <textarea
        rows={3}
        value={description}
        onChange={(event) => onDescriptionChange(event.target.value)}
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
              onChange={() => onToggleTag(tag)}
            />
            <span>{tag}</span>
          </label>
        ))}
      </div>
    </fieldset>
  </>
);
