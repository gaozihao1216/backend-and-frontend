import { z } from "zod";
import { BirdSkillSetSchema, type BirdSkillSet, type BirdSkillStage, type SkillSpec } from "../../../../lib/game-engine/skills/skill-spec.js";

export const DirectorBirdSkillEntrySchema = z.object({
  birdType: z.string(),
  name: z.string(),
  source: z.enum(["system", "designer"]),
  authorId: z.string().nullable().optional(),
  skillName: z.string(),
  tierSkillDescriptions: z.array(z.string()),
  configured: z.boolean(),
  skills: z.unknown().nullable().optional(),
  modelImageUrl: z.string().nullable().optional(),
});

export type DirectorBirdSkillEntry = z.infer<typeof DirectorBirdSkillEntrySchema>;

export const DirectorBirdSkillBoardSchema = z.object({
  birds: z.array(DirectorBirdSkillEntrySchema),
});

export type DirectorBirdSkillBoard = z.infer<typeof DirectorBirdSkillBoardSchema>;
