import { strict as assert } from "node:assert";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(testDir, "../../../..");
const backendSrc = path.join(projectRoot, "backend/microservice/src");
const frontendApi = path.join(projectRoot, "frontend/src/api");

/** 后端 *Api.scala 相对 src 的路径 → 前端 *Api.ts 相对 api/ 的路径（默认去掉 api/ 段）。 */
const frontendPathOverrides: Record<string, string> = {};

const frontendOnlyHelpers = new Set([
  "player/social/PlayerSocialSchemas.ts",
  "player/preparation/PlayerPreparationSchemas.ts",
  "ui/stretchtemplates/stretchTemplatePaths.ts",
]);

const defaultFrontendRel = (backendRel: string): string =>
  backendRel
    .replace(/^([^/]+)\/api\//, "$1/")
    .replace(/\.scala$/, ".ts");

const expectedFrontendRel = (backendRel: string): string =>
  frontendPathOverrides[backendRel] ?? defaultFrontendRel(backendRel);

const backendRequestPathOverrides: Record<string, string> = {
  "admin/objects/submission/request/ReviewSubmissionRequest.scala": "admin/submissions/body/ReviewSubmissionBody.ts",
  "bird/objects/submission/request/ReviewBirdSubmissionRequest.scala": "bird/review/body/ReviewBirdSubmissionBody.ts",
  "level/objects/player/request/CreateLevelCommentRequest.scala": "level/player/action/body/CreateCommentBody.ts",
};

const requestFileToFrontendBodyFile = (file: string): string =>
  file.replace(/Request\.scala$/, "Body.ts");

/** 后端 <module>/objects/<area>/request/XxxRequest.scala → 前端 <module>/<area>/body/XxxBody.ts */
const expectedFrontendBodyRel = (backendRel: string): string => {
  const override = backendRequestPathOverrides[backendRel];
  if (override) {
    return override;
  }

  const levelPlayer = backendRel.match(/^level\/objects\/player\/request\/(.+Request\.scala)$/);
  if (levelPlayer) {
    return `level/player/action/body/${requestFileToFrontendBodyFile(levelPlayer[1]!)}`;
  }

  const uiMappings: Array<[RegExp, string]> = [
    [/^ui\/objects\/button_template\/request\/(.+Request\.scala)$/, "ui/buttontemplates/body"],
    [/^ui\/objects\/component\/request\/(.+Request\.scala)$/, "ui/pagecomponents/body"],
    [/^ui\/objects\/page\/request\/(.+Request\.scala)$/, "ui/pages/body"],
    [/^ui\/objects\/stretch_template\/request\/(.+Request\.scala)$/, "ui/stretchtemplates/body"],
    [/^ui\/objects\/panelworkflows\/request\/(.+Request\.scala)$/, "ui/panelworkflows/body"],
  ];
  for (const [pattern, frontendDir] of uiMappings) {
    const match = backendRel.match(pattern);
    if (match) {
      return `${frontendDir}/${requestFileToFrontendBodyFile(match[1]!)}`;
    }
  }

  const match = backendRel.match(/^([^/]+)\/objects\/(.+)\/request\/([^/]+Request\.scala)$/);
  if (match) {
    const [, module, areaPath, file] = match;
    return `${module}/${areaPath}/body/${requestFileToFrontendBodyFile(file!)}`;
  }
  return backendRel.replace(/Request\.scala$/, "Body.ts");
};

const collectBackendApiFiles = async (directory: string, prefix = ""): Promise<string[]> => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        return collectBackendApiFiles(full, rel);
      }
      if (
        entry.isFile()
        && entry.name.endsWith("Api.scala")
        && !entry.name.endsWith("Request.scala")
        && !rel.includes("/api/internal/")
      ) {
        return [rel];
      }
      return [];
    }),
  );
  return files.flat();
};

const collectFrontendApiFiles = async (directory: string, prefix = ""): Promise<string[]> => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        return collectFrontendApiFiles(full, rel);
      }
      if (entry.isFile() && entry.name.endsWith("Api.ts") && !entry.name.endsWith(".test.ts")) {
        return [rel];
      }
      return [];
    }),
  );
  return files.flat();
};

test("frontend API files mirror backend *Api.scala layout", async () => {
  const backendApis = await collectBackendApiFiles(backendSrc);
  const frontendApis = new Set(await collectFrontendApiFiles(frontendApi));

  assert.ok(backendApis.length > 0, "expected backend Api.scala files");
  assert.ok(frontendApis.size > 0, "expected frontend Api.ts files");

  const missingOnFrontend: string[] = [];
  for (const backendRel of backendApis) {
    const frontendRel = expectedFrontendRel(backendRel);
    if (!frontendApis.has(frontendRel)) {
      missingOnFrontend.push(`${backendRel} → ${frontendRel}`);
    }
  }

  const extraOnFrontend: string[] = [];
  for (const frontendRel of frontendApis) {
    if (frontendOnlyHelpers.has(frontendRel)) {
      continue;
    }
    const hasBackend = backendApis.some((backendRel) => expectedFrontendRel(backendRel) === frontendRel);
    if (!hasBackend) {
      extraOnFrontend.push(frontendRel);
    }
  }

  assert.deepEqual(
    missingOnFrontend,
    [],
    `Backend APIs missing matching frontend files:\n${missingOnFrontend.join("\n")}`,
  );
  assert.deepEqual(
    extraOnFrontend,
    [],
    `Frontend Api.ts files without backend counterpart:\n${extraOnFrontend.join("\n")}`,
  );
});

const collectBackendRequestFiles = async (directory: string, prefix = ""): Promise<string[]> => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        return collectBackendRequestFiles(full, rel);
      }
      if (
        entry.isFile()
        && entry.name.endsWith("Request.scala")
        && rel.includes("/objects/")
        && rel.includes("/request/")
        && !rel.startsWith("system/")
        && !rel.includes("/api/")
      ) {
        return [rel];
      }
      return [];
    }),
  );
  return files.flat();
};

const collectFrontendBodyFiles = async (directory: string, prefix = ""): Promise<string[]> => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        return collectFrontendBodyFiles(full, rel);
      }
      if (entry.isFile() && entry.name.endsWith("Body.ts") && rel.includes("/body/")) {
        return [rel];
      }
      return [];
    }),
  );
  return files.flat();
};

test("frontend body files mirror backend request objects layout", async () => {
  const backendBodies = await collectBackendRequestFiles(backendSrc);
  const frontendBodies = new Set(await collectFrontendBodyFiles(frontendApi));

  assert.ok(backendBodies.length > 0, "expected backend Request.scala files");
  assert.ok(frontendBodies.size > 0, "expected frontend Body.ts files");

  const missingOnFrontend: string[] = [];
  for (const backendRel of backendBodies) {
    const frontendRel = expectedFrontendBodyRel(backendRel);
    if (!frontendBodies.has(frontendRel)) {
      missingOnFrontend.push(`${backendRel} → ${frontendRel}`);
    }
  }

  const extraOnFrontend: string[] = [];
  for (const frontendRel of frontendBodies) {
    const hasBackend = backendBodies.some((backendRel) => expectedFrontendBodyRel(backendRel) === frontendRel);
    if (!hasBackend) {
      extraOnFrontend.push(frontendRel);
    }
  }

  assert.deepEqual(
    missingOnFrontend,
    [],
    `Backend body files missing matching frontend files:\n${missingOnFrontend.join("\n")}`,
  );
  assert.deepEqual(
    extraOnFrontend,
    [],
    `Frontend Body.ts files without backend counterpart:\n${extraOnFrontend.join("\n")}`,
  );
});

test("frontend barrel modules re-export aligned API paths", async () => {
  const exportsDir = path.join(projectRoot, "frontend/src/system/api/exports");

  const adminApi = await readFile(path.join(exportsDir, "admin-api.ts"), "utf8");
  assert.match(adminApi, /admin\/comments\/GetAdminCommentsApi/);
  assert.match(adminApi, /bird\/review\/GetPendingBirdSubmissionsApi/);
  assert.match(adminApi, /admin\/audit\/ListAdminAuditLogsApi/);
  assert.match(adminApi, /admin\/director\/level_assignment\/GetDirectorLevelAssignmentBoardApi/);

  const designerApi = await readFile(path.join(exportsDir, "designer-api.ts"), "utf8");
  assert.match(designerApi, /level\/design\/CreateLevelApi/);
  assert.match(designerApi, /bird\/design\/CreateBirdDesignApi/);

  const playerApi = await readFile(path.join(exportsDir, "player-api.ts"), "utf8");
  assert.match(playerApi, /level\/player\/read\/GetPublishedLevelsApi/);
  assert.match(playerApi, /player\/social\/ListFriendsApi/);
  assert.match(playerApi, /player\/ui\/GetPlayerUiDataApi/);

  const uiApi = await readFile(path.join(exportsDir, "ui-api.ts"), "utf8");
  assert.match(uiApi, /ui\/pagecomponents\//);
  assert.match(uiApi, /ui\/buttontemplates\//);
  assert.match(uiApi, /ui\/stretchtemplates\/ListStretchVisualTemplatesApi/);
  assert.match(uiApi, /ui\/panelworkflows\/RegisterCheckInPanelRewardsApi/);
});
