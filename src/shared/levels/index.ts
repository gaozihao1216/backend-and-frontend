import {
  STARTER_LEVEL_DATA,
  STARTER_LEVEL_DESCRIPTION,
  STARTER_LEVEL_ID,
  STARTER_LEVEL_TAGS,
  STARTER_LEVEL_TITLE,
} from "./starter-level.js";
import type { LevelData, LevelTag } from "../types.js";

export * from "./starter-level.js";

export type BuiltinLevelDefinition = {
  id: string;
  title: string;
  description: string;
  tags: readonly LevelTag[];
  data: LevelData;
};

export const BUILTIN_LEVEL_DEFINITIONS = {
  [STARTER_LEVEL_ID]: {
    id: STARTER_LEVEL_ID,
    title: STARTER_LEVEL_TITLE,
    description: STARTER_LEVEL_DESCRIPTION,
    tags: STARTER_LEVEL_TAGS,
    data: STARTER_LEVEL_DATA,
  },
} satisfies Record<string, BuiltinLevelDefinition>;
