import { useState } from "react";
import { createDefaultLevelInput } from "../../../lib/api.js";
import type { Level, LevelTag } from "../../../../shared/types.js";

const initialForm = createDefaultLevelInput();

export const availableTags: LevelTag[] = ["puzzle", "hard", "beginner", "funny", "strategy"];

export const useDesignerDraft = () => {
  const [title, setTitle] = useState(initialForm.title);
  const [description, setDescription] = useState(initialForm.description ?? "");
  const [selectedTags, setSelectedTags] = useState<LevelTag[]>(initialForm.tags);
  const [createdLevels, setCreatedLevels] = useState<Level[]>([]);
  const [submittedIds, setSubmittedIds] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  return {
    title,
    setTitle,
    description,
    setDescription,
    selectedTags,
    setSelectedTags,
    createdLevels,
    setCreatedLevels,
    submittedIds,
    setSubmittedIds,
    message,
    setMessage,
    error,
    setError,
  };
};
