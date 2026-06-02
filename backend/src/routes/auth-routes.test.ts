import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";
import type { NextFunction, Request, RequestHandler, Response } from "express";
import {
  BindBackendUserResponseDataSchema,
  GetBackendUsersResponseDataSchema,
} from "../../../frontend/src/api/api-contracts.js";

process.env.NODE_ENV = "test";

const { bindBackendUserHandler, getBackendUsersHandler } = await import("./auth-routes.js");
const { resetStore } = await import("../domain/store.js");

beforeEach(() => {
  resetStore();
});

const runHandler = (
  handler: RequestHandler,
  request: Pick<Request, "body" | "query">,
) => {
  const captured: { statusCode: number; body: unknown } = {
    statusCode: 200,
    body: undefined,
  };

  const response = {
    status: (statusCode: number) => {
      captured.statusCode = statusCode;
      return response;
    },
    json: (body: unknown) => {
      captured.body = body;
      return response;
    },
  } as Response;

  const next: NextFunction = (error?: unknown) => {
    if (error) {
      throw error;
    }
  };

  handler(request as Request, response, next);
  assert.notEqual(captured.body, undefined);
  return captured;
};

test("GET /auth/backend-users returns available backend users", async () => {
  const response = runHandler(getBackendUsersHandler, {
    body: {},
    query: {},
  });
  assert.equal(response.statusCode, 200);

  const users = GetBackendUsersResponseDataSchema.parse((response.body as { data: unknown }).data);
  assert.ok(users.length > 0);

  const roles = new Set(users.map((user) => user.role));
  assert.ok(roles.has("player"));
  assert.ok(roles.has("designer"));
  assert.ok(roles.has("admin"));
});

test("POST /auth/bind binds a local auth user to a backend user", async () => {
  const response = runHandler(bindBackendUserHandler, {
    query: {},
    body: {
      localUserId: "auth-route-test-user",
      nickname: "Route Tester",
      role: "designer",
    },
  });

  assert.equal(response.statusCode, 201);

  const user = BindBackendUserResponseDataSchema.parse((response.body as { data: unknown }).data);
  assert.equal(user.role, "designer");
  assert.equal(user.displayName, "Route Tester");
  assert.match(user.id, /^designer-/);
});
