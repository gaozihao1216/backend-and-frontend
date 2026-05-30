import { useState } from "react";
import { createDefaultLevelInput } from "../../../lib/api.js";
import type { Level, LevelData, LevelTag } from "../../../../shared/types.js";

const initialForm = createDefaultLevelInput();

export const availableTags: LevelTag[] = ["puzzle", "hard", "beginner", "funny", "strategy"];

export const useDesignerDraft = () => {
  const [title, setTitle] = useState(initialForm.title);
  const [description, setDescription] = useState(initialForm.description ?? "");
  const [selectedTags, setSelectedTags] = useState<LevelTag[]>(initialForm.tags);
  const [levelData, setLevelData] = useState<LevelData>(initialForm.data);
  const [jsonText, setJsonText] = useState(JSON.stringify(initialForm.data, null, 2));
  const [jsonError, setJsonError] = useState("");
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
    levelData,
    setLevelData,
    jsonText,
    setJsonText,
    jsonError,
    setJsonError,
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
