import express, { type NextFunction, type Request, type Response } from "express";
import { BindBackendUserInputSchema, UserIdParamsSchema, UserProfileSchema, UserSchema } from "../shared/types.js";
import { adminRouter } from "./routes/admin-routes.js";
import { designerRouter } from "./routes/designer-routes.js";
import { playerRouter } from "./routes/player-routes.js";
import { authenticate } from "./middleware/auth.js";
import { HttpError, errorResponse, parseOrThrow, success } from "./lib/http.js";
import { userService } from "./services/user-service.js";

export const createApp = () => {
  const app = express();

  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json(success({ status: "ok" as const }));
  });

  app.get("/users", (_req, res) => {
    res.json(success(userService.getAll()));
  });

  app.post("/users/bind", (req, res) => {
    const input = parseOrThrow(BindBackendUserInputSchema, req.body);
    const user = userService.bindLocalUser(input);
    res.status(201).json(success(parseOrThrow(UserSchema, user)));
  });

  app.use(authenticate);
  app.get("/users/:userId/profile", (req, res) => {
    const params = parseOrThrow(UserIdParamsSchema, req.params);
    const profile = userService.getProfile(params.userId);
    res.json(success(parseOrThrow(UserProfileSchema, profile)));
  });
  app.use("/designer", designerRouter);
  app.use("/admin", adminRouter);
  app.use("/player", playerRouter);

  app.use((req: Request, _res: Response, next: NextFunction) => {
    next(new HttpError(404, "NOT_FOUND", `Route not found: ${req.method} ${req.path}`));
  });

  app.use(
    (error: unknown, _req: Request, res: Response, _next: NextFunction) => {
      if (error instanceof HttpError) {
        const response = errorResponse(
          error.statusCode,
          error.code,
          error.message,
          error.details,
        );
        res.status(response.statusCode).json(response.body);
        return;
      }

      const response = errorResponse(500, "INTERNAL_SERVER_ERROR", "Unexpected server error");
      res.status(response.statusCode).json(response.body);
    },
  );

  return app;
};
