import express, { type NextFunction, type Request, type Response } from "express";
import { adminRouter } from "./routes/admin-routes.js";
import {
  authRouter,
  bindBackendUserHandler,
  getBackendUsersHandler,
} from "./routes/auth-routes.js";
import { designerRouter } from "./routes/designer-routes.js";
import { playerRouter } from "./routes/player-routes.js";
import { userRouter } from "./routes/user-routes.js";
import { authenticate } from "./system/middleware/auth.js";
import { HttpError, errorResponse, success } from "./system/api/http.js";

export const createApp = () => {
  const app = express();

  // 整个项目统一使用 JSON API，因此最先挂载 JSON body parser。
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json(success({ status: "ok" as const }));
  });

  // Deprecated: legacy auth aliases.
  // Use GET /auth/backend-users instead of GET /users.
  // Use POST /auth/bind instead of POST /users/bind.
  // Keep these aliases temporarily for backward compatibility.
  app.get("/users", getBackendUsersHandler);
  app.post("/users/bind", bindBackendUserHandler);

  app.use("/auth", authRouter);

  // 从这里开始的接口都要求有认证用户。
  app.use(authenticate);
  app.use("/users", userRouter);
  app.use("/designer", designerRouter);
  app.use("/admin", adminRouter);
  app.use("/player", playerRouter);

  app.use((req: Request, _res: Response, next: NextFunction) => {
    // 所有未命中的路由统一转换成结构化 404，而不是返回默认 HTML。
    next(new HttpError(404, "NOT_FOUND", `Route not found: ${req.method} ${req.path}`));
  });

  app.use(
    (error: unknown, _req: Request, res: Response, _next: NextFunction) => {
      if (error instanceof HttpError) {
        // 业务错误已知时，保留明确的 code/message 给前端使用。
        const response = errorResponse(
          error.statusCode,
          error.code,
          error.message,
          error.details,
        );
        res.status(response.statusCode).json(response.body);
        return;
      }

      // 未知错误统一降级成 500，避免把内部实现细节暴露给客户端。
      const response = errorResponse(500, "INTERNAL_SERVER_ERROR", "Unexpected server error");
      res.status(response.statusCode).json(response.body);
    },
  );

  return app;
};
