import { Router } from "express";
import {
  CreateLevelInputSchema,
  LevelSchema,
  SubmitLevelInputSchema,
  SubmissionSchema,
} from "../../shared/types.js";
import { getCurrentUser, parseOrThrow, success } from "../lib/http.js";
import { requireRole } from "../middleware/auth.js";
import { levelService } from "../services/level-service.js";
import { submissionService } from "../services/submission-service.js";

export const designerRouter = Router();

designerRouter.use(requireRole("designer"));

designerRouter.post("/levels", (req, res) => {
  const input = parseOrThrow(CreateLevelInputSchema, req.body);
  const currentUser = getCurrentUser(req);
  const level = levelService.createLevel(currentUser.id, input);
  const response = success(parseOrThrow(LevelSchema, level));
  res.status(201).json(response);
});

designerRouter.post("/submissions", (req, res) => {
  const input = parseOrThrow(SubmitLevelInputSchema, req.body);
  const currentUser = getCurrentUser(req);
  levelService.ensureLevelOwnedByDesigner(input.levelId, currentUser.id);
  const submission = submissionService.submitLevel(input.levelId, currentUser.id);
  const response = success(parseOrThrow(SubmissionSchema, submission));
  res.status(201).json(response);
});
