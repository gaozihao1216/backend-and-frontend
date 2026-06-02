import type { LevelData, LevelTag } from "../../../../lib/level-contracts.js";

export const cloneLevelData = (levelData: LevelData): LevelData =>
  JSON.parse(JSON.stringify(levelData)) as LevelData;

export const formatArchiveTimestamp = (value: Date) => {
  const pad = (segment: number) => `${segment}`.padStart(2, "0");
  return `${value.getFullYear()}${pad(value.getMonth() + 1)}${pad(value.getDate())}${pad(value.getHours())}${pad(value.getMinutes())}${pad(value.getSeconds())}`;
};

export const serializeDraft = (draft: {
  title: string;
  description: string;
  selectedTags: LevelTag[];
  levelData: LevelData;
}) =>
  JSON.stringify({
    title: draft.title,
    description: draft.description,
    selectedTags: [...draft.selectedTags].sort(),
    levelData: draft.levelData,
  });
