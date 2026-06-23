import { z } from "zod";

export const SaveDirectorBirdSkillRequestSchema = z.object({
  skills: z.unknown(),
  modelImageUrl: z.string().nullable().optional(),
});

export type SaveDirectorBirdSkillRequest = z.infer<typeof SaveDirectorBirdSkillRequestSchema>;
