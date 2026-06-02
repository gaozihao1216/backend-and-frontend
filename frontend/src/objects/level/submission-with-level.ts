import { z } from "zod";
import { LevelSchema } from "./level.js";
import { SubmissionSchema } from "./submission.js";

export const SubmissionWithLevelSchema = SubmissionSchema.extend({
  level: LevelSchema,
});

export type SubmissionWithLevel = z.infer<typeof SubmissionWithLevelSchema>;
