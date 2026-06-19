#!/usr/bin/env node
/**
 * Reorganize frontend/src/api to mirror backend/microservice/src module subfolders.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const apiRoot = path.resolve(__dirname, "../src/api");
const srcRoot = path.resolve(__dirname, "../src");

const moves = [
  // admin
  ["admin/GetPendingSubmissionsApi.ts", "admin/submissions/GetPendingSubmissionsApi.ts"],
  ["admin/ReviewSubmissionApi.ts", "admin/submissions/ReviewSubmissionApi.ts"],
  ["admin/GetAdminCommentsApi.ts", "admin/comments/GetAdminCommentsApi.ts"],
  ["admin/DeleteCommentApi.ts", "admin/comments/DeleteCommentApi.ts"],
  ["admin/GetDirectorPermissionsApi.ts", "admin/director/permissions/GetDirectorPermissionsApi.ts"],
  ["admin/TransferDirectorPermissionApi.ts", "admin/director/permissions/TransferDirectorPermissionApi.ts"],
  ["admin/DirectorLevelAssignmentApi.ts", "admin/director/level_assignment/DirectorLevelAssignmentApi.ts"],
  ["admin/DirectorBirdSkillApi.ts", "admin/director/bird_skill/DirectorBirdSkillApi.ts"],
  ["admin/GetPendingBirdSubmissionsApi.ts", "bird/review/GetPendingBirdSubmissionsApi.ts"],
  ["admin/ReviewBirdSubmissionApi.ts", "bird/review/ReviewBirdSubmissionApi.ts"],
  // bird design
  ["bird/ListBirdDesignsApi.ts", "bird/design/ListBirdDesignsApi.ts"],
  ["bird/CreateBirdDesignApi.ts", "bird/design/CreateBirdDesignApi.ts"],
  ["bird/UpdateBirdDesignApi.ts", "bird/design/UpdateBirdDesignApi.ts"],
  ["bird/DeleteBirdDesignApi.ts", "bird/design/DeleteBirdDesignApi.ts"],
  ["bird/SubmitBirdDesignApi.ts", "bird/design/SubmitBirdDesignApi.ts"],
  // level
  ["level/CreateLevelApi.ts", "level/design/CreateLevelApi.ts"],
  ["level/SubmitLevelApi.ts", "level/design/SubmitLevelApi.ts"],
  ["level/GetPublishedLevelsApi.ts", "level/player/read/GetPublishedLevelsApi.ts"],
  ["level/GetPublishedLevelApi.ts", "level/player/read/GetPublishedLevelApi.ts"],
  ["level/GetLevelCommentsApi.ts", "level/player/read/GetLevelCommentsApi.ts"],
  ["level/GetFavoriteLevelsApi.ts", "level/player/read/GetFavoriteLevelsApi.ts"],
  ["level/RateLevelApi.ts", "level/player/action/RateLevelApi.ts"],
  ["level/FavoriteLevelApi.ts", "level/player/action/FavoriteLevelApi.ts"],
  ["level/UnfavoriteLevelApi.ts", "level/player/action/UnfavoriteLevelApi.ts"],
  ["level/CreateCommentApi.ts", "level/player/action/CreateCommentApi.ts"],
  // ui
  ["ui/RegisterCheckInPanelRewardsApi.ts", "ui/panelworkflows/RegisterCheckInPanelRewardsApi.ts"],
  ["ui-runtime/GetPlayerUiDataApi.ts", "player/ui/GetPlayerUiDataApi.ts"],
  ["ui-runtime/InvokePlayerUiActionApi.ts", "player/ui/InvokePlayerUiActionApi.ts"],
];

const uiRenames = [
  ["ui/page-components", "ui/pagecomponents"],
  ["ui/button-templates", "ui/buttontemplates"],
];

function mkdirFor(file) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
}

function fixApiRelativeImports(content, relFromApiRoot) {
  const depth = relFromApiRoot.split("/").length - 1;
  const prefix = "../".repeat(depth);
  return content
    .replace(/from "\.\.\/api-contracts\.js"/g, `from "${prefix}api-contracts.js"`)
    .replace(/from "\.\.\/client\.js"/g, `from "${prefix}client.js"`)
    .replace(/from "\.\.\/\.\.\/objects\//g, `from "${prefix}../objects/`);
}

function moveFile(fromRel, toRel) {
  const from = path.join(apiRoot, fromRel);
  const to = path.join(apiRoot, toRel);
  if (!fs.existsSync(from)) {
    console.warn(`skip missing: ${fromRel}`);
    return;
  }
  mkdirFor(to);
  let content = fs.readFileSync(from, "utf8");
  content = fixApiRelativeImports(content, toRel);
  fs.writeFileSync(to, content);
  fs.unlinkSync(from);
  console.log(`${fromRel} -> ${toRel}`);
}

function renameDir(fromRel, toRel) {
  const from = path.join(apiRoot, fromRel);
  const to = path.join(apiRoot, toRel);
  if (!fs.existsSync(from)) return;
  mkdirFor(path.join(to, "x"));
  for (const name of fs.readdirSync(from)) {
    if (name.endsWith(".ts")) {
      moveFile(`${fromRel}/${name}`, `${toRel}/${name}`);
    }
  }
  fs.rmdirSync(from);
  console.log(`dir ${fromRel} -> ${toRel}`);
}

for (const [from, to] of moves) moveFile(from, to);
for (const [from, to] of uiRenames) renameDir(from, to);

// stretch templates -> ui/stretchtemplates/
const stretchSrc = path.join(apiRoot, "ui/stretch-visual-templates-api.ts");
const stretchDest = path.join(apiRoot, "ui/stretchtemplates/stretch-visual-templates-api.ts");
if (fs.existsSync(stretchSrc)) {
  mkdirFor(stretchDest);
  let content = fs.readFileSync(stretchSrc, "utf8");
  content = fixApiRelativeImports(content, "ui/stretchtemplates/stretch-visual-templates-api.ts");
  fs.writeFileSync(stretchDest, content);
  fs.unlinkSync(stretchSrc);
  console.log("ui/stretch-visual-templates-api.ts -> ui/stretchtemplates/stretch-visual-templates-api.ts");
}

// remove empty dirs
for (const dir of ["ui-runtime", "admin", "bird", "level"]) {
  const p = path.join(apiRoot, dir);
  if (fs.existsSync(p)) {
    const entries = fs.readdirSync(p);
    if (entries.length === 0) fs.rmdirSync(p);
  }
}

console.log("moves done");
