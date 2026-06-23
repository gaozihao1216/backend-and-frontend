import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { AuthUser } from "./auth.js";
import {
  ADMIN_AUDIT_LOGS_PATH,
  ADMIN_PROPOSALS_PATH,
  ADMIN_SHOP_PATH,
  DIRECTOR_CONSOLE_PATH,
  checkDirectorConsoleAccess,
  checkRouteAccess,
  checkStandardAdminProposalsAccess,
} from "./route-access.js";

const standardAdmin: AuthUser = {
  id: "1000000001",
  nickname: "admin",
  role: "admin",
  adminLevel: "standard",
  createdAt: new Date().toISOString(),
  apiUserId: "admin-1",
};

const directorAdmin: AuthUser = {
  id: "1000000002",
  nickname: "director",
  role: "admin",
  adminLevel: "director",
  createdAt: new Date().toISOString(),
  apiUserId: "admin-director-1",
};

const player: AuthUser = {
  id: "1000000003",
  nickname: "player",
  role: "player",
  createdAt: new Date().toISOString(),
  apiUserId: "player-1",
};

describe("route-access", () => {
  it("allows standard admin on proposals path", () => {
    assert.equal(checkStandardAdminProposalsAccess(standardAdmin), null);
    assert.equal(checkRouteAccess(ADMIN_PROPOSALS_PATH, standardAdmin), null);
  });

  it("blocks director admin from proposals path", () => {
    assert.notEqual(checkStandardAdminProposalsAccess(directorAdmin), null);
    assert.notEqual(checkRouteAccess(ADMIN_PROPOSALS_PATH, directorAdmin), null);
  });

  it("allows standard admin on audit logs and shop paths", () => {
    assert.equal(checkRouteAccess(ADMIN_AUDIT_LOGS_PATH, standardAdmin), null);
    assert.equal(checkRouteAccess(ADMIN_SHOP_PATH, standardAdmin), null);
  });

  it("blocks director admin from audit logs and shop paths", () => {
    assert.notEqual(checkRouteAccess(ADMIN_AUDIT_LOGS_PATH, directorAdmin), null);
    assert.notEqual(checkRouteAccess(ADMIN_SHOP_PATH, directorAdmin), null);
  });

  it("blocks standard admin from director console", () => {
    assert.notEqual(checkDirectorConsoleAccess(standardAdmin), null);
    assert.notEqual(checkRouteAccess(DIRECTOR_CONSOLE_PATH, standardAdmin), null);
  });

  it("allows director admin on director console", () => {
    assert.equal(checkDirectorConsoleAccess(directorAdmin), null);
    assert.equal(checkRouteAccess(DIRECTOR_CONSOLE_PATH, directorAdmin), null);
  });

  it("blocks player from admin routes", () => {
    assert.notEqual(checkRouteAccess(ADMIN_PROPOSALS_PATH, player), null);
    assert.notEqual(checkRouteAccess(ADMIN_AUDIT_LOGS_PATH, player), null);
    assert.notEqual(checkRouteAccess(ADMIN_SHOP_PATH, player), null);
    assert.notEqual(checkRouteAccess(DIRECTOR_CONSOLE_PATH, player), null);
  });
});
