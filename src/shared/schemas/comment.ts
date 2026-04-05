import { z } from "zod";
import { IdSchema, IsoDateTimeSchema } from "./common.js";

export const CommentSchema = z.object({
  id: IdSchema,
  levelId: IdSchema,
  userId: IdSchema,
  content: z.string().min(1).max(500),
  createdAt: IsoDateTimeSchema,
});

export const CreateCommentInputSchema = z.object({
  content: z.string().trim().min(1).max(500),
});

export const CommentIdParamsSchema = z.object({
  commentId: IdSchema,
});

export type Comment = z.infer<typeof CommentSchema>;
export type CreateCommentInput = z.infer<typeof CreateCommentInputSchema>;
export type CommentIdParams = z.infer<typeof CommentIdParamsSchema>;
