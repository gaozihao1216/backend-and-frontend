import { strict as assert } from "node:assert";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const apiDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(apiDir, "../../..");
const backendSrc = path.join(projectRoot, "backend/microservice/src");
const frontendApi = apiDir;

/** 后端 *Api.scala 相对 src 的路径 → 前端 *Api.ts 相对 api/ 的路径（默认去掉 api/ 段）。 */
const frontendPathOverrides: Record<string, string> = {};

const frontendOnlyHelpers = new Set([
  "player/social/PlayerSocialSchemas.ts",
  "player/preparation/PlayerPreparationSchemas.ts",
  "ui/stretchtemplates/stretchTemplatePaths.ts",
]);

const barrelAndSupport = new Set([
  "index.ts",
  "client.ts",
  "contracts.ts",
  "api-contracts.ts",
  "admin-api.ts",
  "designer-api.ts",
  "player-api.ts",
  "ui-api.ts",
  "user-api.ts",
  "system-api.ts",
  "player-social-api.ts",
  "player-preparation-api.ts",
  "player-ui-api.ts",
]);

const defaultFrontendRel = (backendRel: string): string =>
  backendRel
    .replace(/^([^/]+)\/api\//, "$1/")
    .replace(/\.scala$/, ".ts");

const expectedFrontendRel = (backendRel: string): string =>
  frontendPathOverrides[backendRel] ?? defaultFrontendRel(backendRel);

/** 后端 <module>/body/<path>/XxxBody.scala → 前端 <module>/<path>/body/XxxBody.ts */
const expectedFrontendBodyRel = (backendRel: string): string => {
  const levelPlayer = backendRel.match(/^level\/body\/player\/(.+\.scala)$/);
  if (levelPlayer) {
    return `level/player/action/body/${levelPlayer[1]!.replace(/\.scala$/, ".ts")}`;
  }
  const match = backendRel.match(/^([^/]+)\/body\/(.+)\/([^/]+\.scala)$/);
  if (match) {
    const [, module, areaPath, file] = match;
    return `${module}/${areaPath}/body/${file!.replace(/\.scala$/, ".ts")}`;
  }
  return backendRel.replace(/\.scala$/, ".ts");
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
        && !entry.name.endsWith("Body.scala")
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

const collectBackendBodyFiles = async (directory: string, prefix = ""): Promise<string[]> => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        return collectBackendBodyFiles(full, rel);
      }
      if (entry.isFile() && entry.name.endsWith("Body.scala") && rel.includes("/body/") && !rel.includes("/api/")) {
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

test("frontend body files mirror backend *Body.scala layout", async () => {
  const backendBodies = await collectBackendBodyFiles(backendSrc);
  const frontendBodies = new Set(await collectFrontendBodyFiles(frontendApi));

  assert.ok(backendBodies.length > 0, "expected backend Body.scala files");
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
  const adminApi = await readFile(path.join(frontendApi, "admin-api.ts"), "utf8");
  assert.match(adminApi, /admin\/comments\/GetAdminCommentsApi/);
  assert.match(adminApi, /bird\/review\/GetPendingBirdSubmissionsApi/);
  assert.match(adminApi, /admin\/audit\/ListAdminAuditLogsApi/);
  assert.match(adminApi, /admin\/director\/level_assignment\/GetDirectorLevelAssignmentBoardApi/);

  const designerApi = await readFile(path.join(frontendApi, "designer-api.ts"), "utf8");
  assert.match(designerApi, /level\/design\/CreateLevelApi/);
  assert.match(designerApi, /bird\/design\/CreateBirdDesignApi/);

  const playerApi = await readFile(path.join(frontendApi, "player-api.ts"), "utf8");
  assert.match(playerApi, /level\/player\/read\/GetPublishedLevelsApi/);
  assert.match(playerApi, /player\/social\/ListFriendsApi/);
  assert.match(playerApi, /player\/ui\/GetPlayerUiDataApi/);

  const uiApi = await readFile(path.join(frontendApi, "ui-api.ts"), "utf8");
  assert.match(uiApi, /ui\/pagecomponents\//);
  assert.match(uiApi, /ui\/buttontemplates\//);
  assert.match(uiApi, /ui\/stretchtemplates\/ListStretchVisualTemplatesApi/);
  assert.match(uiApi, /ui\/panelworkflows\/RegisterCheckInPanelRewardsApi/);
});

test("barrel and support files are excluded from one-to-one Api naming", () => {
  for (const file of barrelAndSupport) {
    assert.ok(!file.endsWith("Api.ts") || file.includes("-api"), `${file} should not look like domain Api`);
  }
});
