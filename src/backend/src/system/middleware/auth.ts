import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import type { UserRole } from "../data/store-contracts.js";
import { users } from "../data/store.js";
import { HttpError, parseOrThrow } from "../lib/http.js";

const AuthHeadersSchema = z.object({
  "x-user-id": z.string().min(1),
});

export const authenticate = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const headers = parseOrThrow(AuthHeadersSchema, req.headers);
  const user = users.find((candidate) => candidate.id === headers["x-user-id"]);

  if (!user) {
    next(new HttpError(401, "UNAUTHORIZED", "Unknown user"));
    return;
  }

  req.currentUser = user;
  next();
};

export const requireRole =
  (...roles: UserRole[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.currentUser || !roles.includes(req.currentUser.role)) {
      next(new HttpError(403, "FORBIDDEN", "Insufficient role"));
      return;
    }
    next();
  };
