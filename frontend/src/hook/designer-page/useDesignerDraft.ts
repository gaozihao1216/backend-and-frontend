import { useState } from "react";
import { createDefaultLevelInput } from "../../api/index.js";
import type { LevelTag } from "../../objects/system/system-objects.js";

const initialForm = createDefaultLevelInput();

export const availableTags: LevelTag[] = ["puzzle", "hard", "beginner", "funny", "strategy"];

export const useDesignerDraft = () => {
  const [title, setTitle] = useState(initialForm.title);
  const [description, setDescription] = useState(initialForm.description ?? "");
  const [selectedTags, setSelectedTags] = useState<LevelTag[]>(initialForm.tags);

  const toggleTag = (tag: LevelTag) => {
    setSelectedTags((current) =>
      current.includes(tag) ? current.filter((currentTag) => currentTag !== tag) : [...current, tag],
    );
  };

  return {
    title,
    setTitle,
    description,
    setDescription,
    selectedTags,
    setSelectedTags,
    toggleTag,
  };
};
