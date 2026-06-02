import { Router } from "express";
import {
  CreateLevelRequestBodySchema,
  CreateLevelResponseDataSchema,
  SubmitLevelRequestBodySchema,
  SubmitLevelResponseDataSchema,
} from "../system/api/api-contracts.js";
import { getCurrentUser, parseOrThrow, success } from "../system/api/http.js";
import { requireRole } from "../system/middleware/auth.js";
import { levelService } from "../services/level-service.js";
import { submissionService } from "../services/submission-service.js";

export const designerRouter = Router();

// 设计师路由统一先过角色校验，后面的 handler 默认都基于“当前用户是 designer”。
designerRouter.use(requireRole("designer"));

designerRouter.post("/levels", (req, res) => {
  // 路由层只做参数解析与响应封装，真正的业务逻辑下沉到 service。
  const input = parseOrThrow(CreateLevelRequestBodySchema, req.body);
  const currentUser = getCurrentUser(req);
  const level = levelService.createLevel(currentUser.id, input);
  const response = success(parseOrThrow(CreateLevelResponseDataSchema, level));
  res.status(201).json(response);
});

designerRouter.post("/submissions", (req, res) => {
  const input = parseOrThrow(SubmitLevelRequestBodySchema, req.body);
  const currentUser = getCurrentUser(req);
  // 提交前先确认关卡归属，避免设计师替别人提交。
  levelService.ensureLevelOwnedByDesigner(input.levelId, currentUser.id);
  const submission = submissionService.submitLevel(input.levelId, currentUser.id);
  const response = success(parseOrThrow(SubmitLevelResponseDataSchema, submission));
  res.status(201).json(response);
});
