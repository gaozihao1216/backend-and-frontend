import { Router } from "express";
import {
  CommentIdParamsSchema,
  CommentSchema,
  ReviewSubmissionInputSchema,
  SubmissionIdParamsSchema,
  SubmissionSchema,
  SubmissionWithLevelSchema,
} from "../../shared/types.js";
import { getCurrentUser, parseOrThrow, success } from "../lib/http.js";
import { commentService } from "../services/comment-service.js";
import { requireRole } from "../middleware/auth.js";
import { levelService } from "../services/level-service.js";
import { submissionService } from "../services/submission-service.js";

export const adminRouter = Router();

adminRouter.use(requireRole("admin"));

adminRouter.get("/comments", (_req, res) => {
  // 管理员查看的是全量评论，因此不做按关卡过滤。
  const comments = commentService
    .getAllComments()
    .map((comment) => parseOrThrow(CommentSchema, comment));
  res.json(success(comments));
});

adminRouter.delete("/comments/:commentId", (req, res) => {
  const params = parseOrThrow(CommentIdParamsSchema, req.params);
  const deleted = commentService.deleteComment(params.commentId);
  res.json(success(parseOrThrow(CommentSchema, deleted)));
});

adminRouter.get("/submissions/pending", (_req, res) => {
  // 这里顺手把 submission 关联的 level 拼出来，方便前端审核页直接展示。
  const pending = submissionService.getPendingSubmissions().map((submission) => {
    const level = levelService.getLevelById(submission.levelId);
    return parseOrThrow(SubmissionWithLevelSchema, {
      ...submission,
      level,
    });
  });
  res.json(success(pending));
});

adminRouter.post(
  "/submissions/:submissionId/review",
  (req, res) => {
    const params = parseOrThrow(SubmissionIdParamsSchema, req.params);
    const input = parseOrThrow(ReviewSubmissionInputSchema, req.body);
    const currentUser = getCurrentUser(req);
    const submission = submissionService.reviewSubmission(
      params.submissionId,
      currentUser.id,
      input,
    );
    res.json(success(parseOrThrow(SubmissionSchema, submission)));
  },
);
