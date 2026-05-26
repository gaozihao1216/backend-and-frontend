import { Router } from "express";
import {
  GetUserProfileRequestParamsSchema,
  GetUserProfileResponseDataSchema,
} from "../../shared/types.js";
import { parseOrThrow, success } from "../lib/http.js";
import { userService } from "../services/user-service.js";

export const userRouter = Router();

userRouter.get("/:userId/profile", (req, res) => {
  const params = parseOrThrow(GetUserProfileRequestParamsSchema, req.params);
  const profile = userService.getProfile(params.userId);
  res.json(success(parseOrThrow(GetUserProfileResponseDataSchema, profile)));
});
