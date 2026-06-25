import { z } from "zod";

export const CreateCommentRequestBodySchema = z.object({
  content: z.string().trim().min(1).max(500),
});

export type CreateCommentRequestBody = z.infer<typeof CreateCommentRequestBodySchema>;
