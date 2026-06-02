import { Router, type RequestHandler } from "express";
import {
  BindBackendUserResponseDataSchema,
  BindBackendUserRequestBodySchema,
  GetBackendUsersRequestQuerySchema,
  GetBackendUsersResponseDataSchema,
} from "../lib/api-contracts.js";
import { parseOrThrow, success } from "../lib/http.js";
import { authService } from "../services/auth-service.js";

export const authRouter = Router();

export const getBackendUsersHandler: RequestHandler = (req, res) => {
  parseOrThrow(GetBackendUsersRequestQuerySchema, req.query);
  const users = parseOrThrow(GetBackendUsersResponseDataSchema, authService.getBackendUsers());
  res.json(success(users));
};

export const bindBackendUserHandler: RequestHandler = (req, res) => {
  const input = parseOrThrow(BindBackendUserRequestBodySchema, req.body);
  const user = authService.bindBackendUser(input);
  res.status(201).json(success(parseOrThrow(BindBackendUserResponseDataSchema, user)));
};

authRouter.get("/backend-users", getBackendUsersHandler);
authRouter.post("/bind", bindBackendUserHandler);
