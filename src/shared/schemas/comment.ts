import { z } from "zod";
import { IdSchema, IsoDateTimeSchema } from "./common.js";

// 评论内容单独限制长度，避免把超长文本塞进轻量社区流。
export const CommentSchema = z.object({
  id: IdSchema,
  levelId: IdSchema,
  userId: IdSchema,
  content: z.string().min(1).max(500),
  createdAt: IsoDateTimeSchema,
});

export const CreateCommentInputSchema = z.object({
  // 创建输入会先 trim，防止只输入空格也通过校验。
  content: z.string().trim().min(1).max(500),
});

export const CommentIdParamsSchema = z.object({
  commentId: IdSchema,
});

export type Comment = z.infer<typeof CommentSchema>;
export type CreateCommentInput = z.infer<typeof CreateCommentInputSchema>;
export type CommentIdParams = z.infer<typeof CommentIdParamsSchema>;
