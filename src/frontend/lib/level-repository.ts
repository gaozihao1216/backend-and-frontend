import {
  BUILTIN_LEVEL_DEFINITIONS,
  STARTER_LEVEL_ID,
} from "../../shared/levels/index.js";
import type { Level, LevelData, LevelTag } from "../../shared/types.js";

export type LevelSourceKind = "builtin" | "published" | "submission" | "draft";

export type LevelSource = {
  key: string;
  kind: LevelSourceKind;
  originLabel: string;
  level: Level;
};

const REPOSITORY_TIMESTAMP = new Date(0).toISOString();

const buildLevelRecord = (input: {
  id: string;
  title: string;
  description: string;
  tags: LevelTag[];
  data: LevelData;
  authorId: string;
  status: Level["status"];
}): Level => ({
  ...input,
  averageRating: 0,
  ratingCount: 0,
  createdAt: REPOSITORY_TIMESTAMP,
  updatedAt: REPOSITORY_TIMESTAMP,
  ...(input.status === "published" ? { publishedAt: REPOSITORY_TIMESTAMP } : {}),
});

export const getStarterLevelSource = (): LevelSource => ({
  key: STARTER_LEVEL_ID,
  kind: "builtin",
  originLabel: "Built-in starter level",
  level: buildLevelRecord({
    id: BUILTIN_LEVEL_DEFINITIONS[STARTER_LEVEL_ID]!.id,
    title: BUILTIN_LEVEL_DEFINITIONS[STARTER_LEVEL_ID]!.title,
    description: BUILTIN_LEVEL_DEFINITIONS[STARTER_LEVEL_ID]!.description,
    tags: [...BUILTIN_LEVEL_DEFINITIONS[STARTER_LEVEL_ID]!.tags],
    data: BUILTIN_LEVEL_DEFINITIONS[STARTER_LEVEL_ID]!.data,
    authorId: "designer-1",
    status: "published",
  }),
});

export const createPublishedLevelSource = (level: Level): LevelSource => ({
  key: level.id,
  kind: "published",
  originLabel: "Published level data",
  level,
});

export const createSubmissionLevelSource = (level: Level): LevelSource => ({
  key: level.id,
  kind: "submission",
  originLabel: "Submission review data",
  level,
});

export const createDraftLevelSource = (input: {
  title: string;
  description: string;
  tags: LevelTag[];
  data: LevelData;
  authorId: string;
}): LevelSource => ({
  key: "designer-draft-preview",
  kind: "draft",
  originLabel: "Designer draft data",
  level: buildLevelRecord({
    id: "designer-draft-preview",
    title: input.title.trim() || "Draft Preview",
    description: input.description,
    tags: input.tags,
    data: input.data,
    authorId: input.authorId,
    status: "draft",
  }),
});
