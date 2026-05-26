import { Router } from "express";
import {
  BindBackendUserRequestBodySchema,
  BoundBackendUserSchema,
  GetBackendUsersResponseDataSchema,
} from "../../shared/types.js";
import { parseOrThrow, success } from "../lib/http.js";
import { authService } from "../services/auth-service.js";

export const authRouter = Router();

authRouter.get("/backend-users", (_req, res) => {
  const users = parseOrThrow(GetBackendUsersResponseDataSchema, authService.getBackendUsers());
  res.json(success(users));
});

authRouter.post("/bind", (req, res) => {
  const input = parseOrThrow(BindBackendUserRequestBodySchema, req.body);
  const user = authService.bindBackendUser(input);
  res.status(201).json(success(parseOrThrow(BoundBackendUserSchema, user)));
});
