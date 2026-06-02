import { Router } from "express";
import {
  DeleteCommentRequestParamsSchema,
  DeleteCommentResponseDataSchema,
  GetAdminCommentsRequestQuerySchema,
  GetAdminCommentsResponseDataSchema,
  GetPendingSubmissionsRequestQuerySchema,
  GetPendingSubmissionsResponseDataSchema,
  ReviewSubmissionRequestBodySchema,
  ReviewSubmissionRequestParamsSchema,
  ReviewSubmissionResponseDataSchema,
} from "../lib/api-contracts.js";
import { getCurrentUser, parseOrThrow, success } from "../lib/http.js";
import { commentService } from "../services/comment-service.js";
import { requireRole } from "../middleware/auth.js";
import { levelService } from "../services/level-service.js";
import { submissionService } from "../services/submission-service.js";

export const adminRouter = Router();

adminRouter.use(requireRole("admin"));

adminRouter.get("/comments", (req, res) => {
  parseOrThrow(GetAdminCommentsRequestQuerySchema, req.query);
  // 管理员查看的是全量评论，因此不做按关卡过滤。
  const comments = commentService
    .getAllComments()
    .map((comment) => parseOrThrow(GetAdminCommentsResponseDataSchema.element, comment));
  res.json(success(parseOrThrow(GetAdminCommentsResponseDataSchema, comments)));
});

adminRouter.delete("/comments/:commentId", (req, res) => {
  const params = parseOrThrow(DeleteCommentRequestParamsSchema, req.params);
  const deleted = commentService.deleteComment(params.commentId);
  res.json(success(parseOrThrow(DeleteCommentResponseDataSchema, deleted)));
});

adminRouter.get("/submissions/pending", (req, res) => {
  parseOrThrow(GetPendingSubmissionsRequestQuerySchema, req.query);
  // 这里顺手把 submission 关联的 level 拼出来，方便前端审核页直接展示。
  const pending = submissionService.getPendingSubmissions().map((submission) => {
    const level = levelService.getLevelById(submission.levelId);
    return parseOrThrow(GetPendingSubmissionsResponseDataSchema.element, {
      ...submission,
      level,
    });
  });
  res.json(success(parseOrThrow(GetPendingSubmissionsResponseDataSchema, pending)));
});

adminRouter.post(
  "/submissions/:submissionId/review",
  (req, res) => {
    const params = parseOrThrow(ReviewSubmissionRequestParamsSchema, req.params);
    const input = parseOrThrow(ReviewSubmissionRequestBodySchema, req.body);
    const currentUser = getCurrentUser(req);
    const submission = submissionService.reviewSubmission(
      params.submissionId,
      currentUser.id,
      input,
    );
    res.json(success(parseOrThrow(ReviewSubmissionResponseDataSchema, submission)));
  },
);
