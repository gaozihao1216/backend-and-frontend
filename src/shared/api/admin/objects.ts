import { z } from "zod";
import { CommentSchema } from "../../schemas/comment.js";
import { SubmissionSchema, SubmissionWithLevelSchema } from "../../schemas/submission.js";

export const AdminCommentSchema = CommentSchema;
export const PendingSubmissionSchema = SubmissionWithLevelSchema;
export const ReviewedSubmissionSchema = SubmissionSchema;

export type AdminComment = z.infer<typeof AdminCommentSchema>;
export type PendingSubmission = z.infer<typeof PendingSubmissionSchema>;
export type ReviewedSubmission = z.infer<typeof ReviewedSubmissionSchema>;
