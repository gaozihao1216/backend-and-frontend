import { Router } from "express";
import {
  GetUserProfileRequestQuerySchema,
  GetUserProfileRequestParamsSchema,
  GetUserProfileResponseDataSchema,
} from "../system/api/api-contracts.js";
import { parseOrThrow, success } from "../system/api/http.js";
import { userService } from "../services/user-service.js";

export const userRouter = Router();

userRouter.get("/:userId/profile", (req, res) => {
  parseOrThrow(GetUserProfileRequestQuerySchema, req.query);
  const params = parseOrThrow(GetUserProfileRequestParamsSchema, req.params);
  const profile = userService.getProfile(params.userId);
  res.json(success(parseOrThrow(GetUserProfileResponseDataSchema, profile)));
});
