import { z } from "zod";
import { LevelSchema } from "../../schemas/level.js";
import { SubmissionSchema } from "../../schemas/submission.js";

export const DesignerLevelSchema = LevelSchema;
export const DesignerSubmissionSchema = SubmissionSchema;

export type DesignerLevel = z.infer<typeof DesignerLevelSchema>;
export type DesignerSubmission = z.infer<typeof DesignerSubmissionSchema>;
