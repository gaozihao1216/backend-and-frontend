#!/usr/bin/env node
/**
 * One-shot migration: reorganize frontend/src/objects to mirror backend layout.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const objects = path.join(root, "frontend/src/objects");
const src = path.join(root, "frontend/src");

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function moveFile(fromRel, toRel) {
  const from = path.join(objects, fromRel);
  const to = path.join(objects, toRel);
  if (!fs.existsSync(from)) {
    console.warn(`skip missing: ${fromRel}`);
    return;
  }
  ensureDir(path.dirname(to));
  fs.renameSync(from, to);
  console.log(`moved ${fromRel} -> ${toRel}`);
}

function read(rel) {
  return fs.readFileSync(path.join(objects, rel), "utf8");
}

function write(rel, content) {
  const full = path.join(objects, rel);
  ensureDir(path.dirname(full));
  fs.writeFileSync(full, content);
  console.log(`wrote ${rel}`);
}

function replaceInFile(rel, replacements) {
  const full = path.join(objects, rel);
  if (!fs.existsSync(full)) return;
  let content = fs.readFileSync(full, "utf8");
  for (const [from, to] of replacements) {
    content = content.split(from).join(to);
  }
  fs.writeFileSync(full, content);
}

// --- Level subfolders ---
const levelMoves = [
  ["level/level.ts", "level/level/level.ts"],
  ["level/level-data.ts", "level/level/level-data.ts"],
  ["level/game-world.ts", "level/level/game-world.ts"],
  ["level/favorite.ts", "level/social/favorite.ts"],
  ["level/favorite-with-level.ts", "level/social/favorite-with-level.ts"],
  ["level/rating.ts", "level/social/rating.ts"],
  ["level/level-comment.ts", "level/social/level-comment.ts"],
  ["level/submission.ts", "level/submission/submission.ts"],
  ["level/submission-with-level.ts", "level/submission/submission-with-level.ts"],
  ["level/bird-pool.ts", "level/inventory/bird-pool.ts"],
  ["level/bird-inventory.ts", "level/inventory/bird-inventory.ts"],
  ["level/position.ts", "level/terrain/position.ts"],
  ["level/size.ts", "level/terrain/size.ts"],
  ["level/level-ground.ts", "level/terrain/level-ground.ts"],
  ["level/ground-line.ts", "level/terrain/ground-line.ts"],
  ["level/ground-bezier.ts", "level/terrain/ground-bezier.ts"],
  ["level/level-terrain.ts", "level/terrain/level-terrain.ts"],
  ["level/terrain-void-span.ts", "level/terrain/terrain-void-span.ts"],
  ["level/level-obstacle.ts", "level/terrain/level-obstacle.ts"],
  ["level/level-enemy.ts", "level/terrain/level-enemy.ts"],
];
for (const [from, to] of levelMoves) moveFile(from, to);

// Fix level internal imports (system path depth unchanged at ../../system)
const levelInternalFixes = [
  ["level/level/level.ts", [["../system/", "../../system/"], ["./level-data.js", "./level-data.js"]]],
  ["level/level/level-data.ts", [
    ["../system/", "../../system/"],
    ["./bird-inventory.js", "../inventory/bird-inventory.js"],
    ["./bird-pool.js", "../inventory/bird-pool.js"],
    ["./game-world.js", "./game-world.js"],
    ["./level-ground.js", "../terrain/level-ground.js"],
    ["./level-terrain.js", "../terrain/level-terrain.js"],
    ["./level-enemy.js", "../terrain/level-enemy.js"],
    ["./level-obstacle.js", "../terrain/level-obstacle.js"],
  ]],
  ["level/social/favorite-with-level.ts", [
    ["./level.js", "../level/level.js"],
  ]],
  ["level/submission/submission-with-level.ts", [
    ["./level.js", "../level/level.js"],
    ["./submission.js", "./submission.js"],
  ]],
  ["level/terrain/ground-line.ts", [["./position.js", "./position.js"]]],
  ["level/terrain/ground-bezier.ts", [["./position.js", "./position.js"]]],
  ["level/terrain/level-enemy.ts", [["../system/", "../../../system/"]]],
  ["level/terrain/level-obstacle.ts", [["../system/", "../../../system/"]]],
  ["level/terrain/level-terrain.ts", [["../system/", "../../../system/"]]],
  ["level/terrain/level-ground.ts", [["./ground-bezier.js", "./ground-bezier.js"], ["./ground-line.js", "./ground-line.js"]]],
  ["level/submission/submission.ts", [["../system/", "../../../system/"]]],
];
for (const [rel, reps] of levelInternalFixes) replaceInFile(rel, reps);

// Fix level-enemy/obstacle system path - they were at level/ so ../system, now at terrain/ so ../../../system
replaceInFile("level/terrain/level-enemy.ts", [
  ['from "../../../system/schema-utils.js"', 'from "../../system/schema-utils.js"'],
]);
replaceInFile("level/terrain/level-obstacle.ts", [
  ['from "../../../system/schema-utils.js"', 'from "../../system/schema-utils.js"'],
]);
replaceInFile("level/terrain/level-terrain.ts", [
  ['from "../../../system/schema-utils.js"', 'from "../../system/schema-utils.js"'],
]);
replaceInFile("level/submission/submission.ts", [
  ['from "../../../system/schema-utils.js"', 'from "../../system/schema-utils.js"'],
]);

// --- Admin ---
moveFile("admin/review-audit.ts", "admin/submission/review-audit.ts");
moveFile("admin/reviewed-submission.ts", "admin/submission/reviewed-submission.ts");
moveFile("admin/director-permission-summary.ts", "admin/director/permissions/director-permission-summary.ts");
moveFile("admin/director-transfer-result.ts", "admin/director/permissions/director-transfer-result.ts");

// Split level-slot-assignment
const assignmentSrc = read("admin/level-slot-assignment.ts");
write(
  "admin/director/level_assignment/assignment/level-slot-assignment.ts",
  assignmentSrc
    .replace(
      'import { BirdPoolSchema } from "../level/bird-pool.js";',
      'import { BirdPoolSchema } from "../../../level/inventory/bird-pool.js";',
    )
    .replace(
      'import { SubmissionWithLevelSchema } from "../level/submission-with-level.js";',
      'import { SubmissionWithLevelSchema } from "../../../level/submission/submission-with-level.js";',
    )
    .replace(
      'import { nullishToUndefined } from "../system/schema-utils.js";',
      'import { nullishToUndefined } from "../../../system/schema-utils.js";',
    )
    .split("\n")
    .slice(0, 25)
    .join("\n") + "\n",
);

write(
  "admin/director/level_assignment/board/director-level-assignment-board.ts",
  `import { z } from "zod";
import { SubmissionWithLevelSchema } from "../../../../level/submission/submission-with-level.js";
import {
  LevelSlotAssignmentDetailSchema,
} from "../assignment/level-slot-assignment.js";

export const BirdPoolOptionSchema = z.object({
  birdType: z.string().min(1),
  name: z.string().min(1),
  source: z.enum(["system", "designer"]),
  authorId: z.string().nullable().optional(),
});

export type BirdPoolOption = z.infer<typeof BirdPoolOptionSchema>;

export const DirectorLevelAssignmentBoardSchema = z.object({
  assignments: z.array(LevelSlotAssignmentDetailSchema),
  pendingApproved: z.array(SubmissionWithLevelSchema),
  birdPoolOptions: z.array(BirdPoolOptionSchema).default([]),
});

export type DirectorLevelAssignmentBoard = z.infer<typeof DirectorLevelAssignmentBoardSchema>;
`,
);

fs.unlinkSync(path.join(objects, "admin/level-slot-assignment.ts"));

// Fix admin submission system imports
replaceInFile("admin/submission/review-audit.ts", [["../system/", "../../system/"]]);
replaceInFile("admin/submission/reviewed-submission.ts", [["../system/", "../../system/"]]);
replaceInFile("admin/director/permissions/director-permission-summary.ts", [["../system/", "../../../system/"]]);
replaceInFile("admin/director/permissions/director-transfer-result.ts", [["../system/", "../../../system/"]]);

// --- Bird ---
moveFile("bird/bird-design.ts", "bird/design/bird-design.ts");
moveFile("bird/bird-submission.ts", "bird/submission/bird-submission.ts");

const birdSkillSrc = read("bird/bird-skill-config.ts");
write(
  "bird/skill/director/director-bird-skill-entry.ts",
  birdSkillSrc.split("export const parseBirdSkillSet")[0].trimEnd() + "\n",
);
write(
  "bird/skill/director/director-bird-skill-board.ts",
  `export {
  DirectorBirdSkillBoardSchema,
  type DirectorBirdSkillBoard,
} from "./director-bird-skill-entry.js";
`,
);
write(
  "bird/skill/director/bird-skill-helpers.ts",
  birdSkillSrc.slice(birdSkillSrc.indexOf("export const parseBirdSkillSet")),
);
replaceInFile("bird/skill/director/director-bird-skill-entry.ts", [
  ['from "../../lib/game-engine/skills/skill-spec.js"', 'from "../../../../lib/game-engine/skills/skill-spec.js"'],
]);
replaceInFile("bird/skill/director/bird-skill-helpers.ts", [
  ['from "../../lib/game-engine/skills/skill-spec.js"', 'from "../../../../lib/game-engine/skills/skill-spec.js"'],
]);
fs.unlinkSync(path.join(objects, "bird/bird-skill-config.ts"));

// Fix bird design/submission system paths
replaceInFile("bird/design/bird-design.ts", [["../system/", "../../system/"]]);
replaceInFile("bird/submission/bird-submission.ts", [
  ["../system/", "../../system/"],
  ["./bird-design.js", "../design/bird-design.js"],
]);

// --- Player ---
moveFile("player/shop-item.ts", "player/shop/shop-item.ts");

// --- UI: move templates ---
moveFile("ui-customization/button-template.ts", "ui/button_template/button-template.ts");
moveFile("ui-customization/template-category.ts", "ui/category/template-category.ts");
moveFile("ui-customization/stretch-visual-template.ts", "ui/stretch_template/stretch-visual-template.ts");

replaceInFile("ui/button_template/button-template.ts", [
  ['from "./template-category.js"', 'from "../category/template-category.js"'],
]);
replaceInFile("ui/stretch_template/stretch-visual-template.ts", [
  ['from "./template-category.js"', 'from "../category/template-category.js"'],
]);

// --- UI: split page-config ---
const pageConfig = read("ui-customization/page-config.ts");

function extractAndWrite(filename, startMarker, endMarker, extraImports = "") {
  const start = pageConfig.indexOf(startMarker);
  const end = endMarker ? pageConfig.indexOf(endMarker, start) : pageConfig.length;
  const chunk = pageConfig.slice(start, end).trimEnd();
  write(
    filename,
    `import { z } from "zod";
${extraImports}
${chunk}
`,
  );
}

write(
  "ui/component/component-position.ts",
  `import { z } from "zod";

export const ComponentPositionUnitSchema = z.enum(["percent", "px"]);
export type ComponentPositionUnit = z.infer<typeof ComponentPositionUnitSchema>;

export const ComponentPositionSchema = z.object({
  unit: ComponentPositionUnitSchema.default("percent"),
  x: z.number().min(0),
  y: z.number().min(0),
  width: z.number().positive(),
  height: z.number().positive(),
});
export type ComponentPosition = z.infer<typeof ComponentPositionSchema>;
`,
);

write(
  "ui/component/component-style.ts",
  `import { z } from "zod";
import { nullishToUndefined } from "../../system/schema-utils.js";

export const ComponentStyleSchema = z.object({
  variant: nullishToUndefined(z.enum(["primary", "secondary", "ghost"])),
  backgroundColor: nullishToUndefined(z.string().min(1)),
  textColor: nullishToUndefined(z.string().min(1)),
  borderRadius: nullishToUndefined(z.number().min(0)),
  fontSize: nullishToUndefined(z.number().positive()),
  textScalePercent: nullishToUndefined(z.number().positive().max(100)),
  lockAspectRatio: nullishToUndefined(z.number().positive()),
});
export type ComponentStyle = z.infer<typeof ComponentStyleSchema>;

export const ComponentVisualEffectSchema = z.object({
  templateId: z.enum(["none", "softGlow", "rewardPulse", "slideIn", "sparkle"]).default("none"),
  intensity: nullishToUndefined(z.number().min(0).max(100)),
});
export type ComponentVisualEffect = z.infer<typeof ComponentVisualEffectSchema>;

export const TextArtPresetSchema = z.enum([
  "plain",
  "goldGradient",
  "inkBrush",
  "runningScript",
  "sealCinnabar",
]);
export type TextArtPreset = z.infer<typeof TextArtPresetSchema>;

export const TextArtGradientDirectionSchema = z.enum([
  "toBottom",
  "toTop",
  "toRight",
  "toLeft",
  "diagonal",
]);
export type TextArtGradientDirection = z.infer<typeof TextArtGradientDirectionSchema>;

export const TextArtGradientIntensitySchema = z.enum([
  "soft",
  "normal",
  "strong",
]);
export type TextArtGradientIntensity = z.infer<typeof TextArtGradientIntensitySchema>;

export const TextArtDesignSchema = z.object({
  preset: TextArtPresetSchema.default("goldGradient"),
  accentColor: nullishToUndefined(z.string().min(1)),
  gradientDirection: nullishToUndefined(TextArtGradientDirectionSchema),
  gradientIntensity: nullishToUndefined(TextArtGradientIntensitySchema),
});
export type TextArtDesign = z.infer<typeof TextArtDesignSchema>;
`,
);

write(
  "ui/component/stretch-visual-design.ts",
  `import { z } from "zod";
import { nullishToUndefined } from "../../system/schema-utils.js";

export const ButtonImageFrameSchema = z.object({
  x: z.number().min(-25).max(125),
  y: z.number().min(-25).max(125),
  width: z.number().positive().max(125),
  height: z.number().positive().max(125),
});
export type ButtonImageFrame = z.infer<typeof ButtonImageFrameSchema>;

export const StretchVisualDesignSchema = z.object({
  templateId: z.string().min(1),
  sourceDataUrl: nullishToUndefined(z.string().min(1)),
  frame: nullishToUndefined(ButtonImageFrameSchema),
});
export type StretchVisualDesign = z.infer<typeof StretchVisualDesignSchema>;

export const ButtonPatternLayerKindSchema = z.enum(["pattern", "artText"]);
export type ButtonPatternLayerKind = z.infer<typeof ButtonPatternLayerKindSchema>;

export const ButtonPatternLayerSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  kind: ButtonPatternLayerKindSchema.default("pattern"),
  design: StretchVisualDesignSchema,
  artTextLabel: nullishToUndefined(z.string().min(1)),
});
export type ButtonPatternLayer = z.infer<typeof ButtonPatternLayerSchema>;

export const PanelDecorationSchema = z.object({
  templateId: z.enum([
    "plain",
    "paper",
    "reward",
    "glass",
    "notice",
    "levelSky",
    "levelGrass",
    "levelParchment",
    "levelTwilight",
    "levelInk",
  ]).default("plain"),
  accentColor: nullishToUndefined(z.string().min(1)),
  backgroundDesign: nullishToUndefined(StretchVisualDesignSchema),
});
export type PanelDecoration = z.infer<typeof PanelDecorationSchema>;
`,
);

write(
  "ui/component/component-binding.ts",
  `import { z } from "zod";
import { nullishToUndefined } from "../../system/schema-utils.js";

export const UiDataSourceSchema = z.object({
  type: z.enum(["none", "api"]),
  apiKey: nullishToUndefined(z.string().min(1)),
  params: nullishToUndefined(z.record(z.string(), z.string())),
  refreshMode: nullishToUndefined(z.enum(["manual", "onOpen", "interval"])),
});
export type UiDataSource = z.infer<typeof UiDataSourceSchema>;

export const ComponentBindingSchema = z.object({
  text: nullishToUndefined(z.string().min(1)),
  visibleWhen: nullishToUndefined(z.string().min(1)),
  disabledWhen: nullishToUndefined(z.string().min(1)),
});
export type ComponentBinding = z.infer<typeof ComponentBindingSchema>;

export const PlayerCurrencyRewardSchema = z.object({
  coins: z.number().int().min(0).default(0),
  gems: z.number().int().min(0).default(0),
  fragments: z.number().int().min(0).default(0),
});
export type PlayerCurrencyReward = z.infer<typeof PlayerCurrencyRewardSchema>;
`,
);

write(
  "ui/component/button-design.ts",
  `import { z } from "zod";
import { nullishToUndefined } from "../../system/schema-utils.js";
import { ButtonTemplateSliceSchema } from "../button_template/button-template.js";
import { ComponentStyleSchema } from "./component-style.js";
import {
  ButtonImageFrameSchema,
  ButtonPatternLayerSchema,
  StretchVisualDesignSchema,
} from "./stretch-visual-design.js";

export const ButtonBaseDesignSchema = z.object({
  templateId: z.string().min(1),
  sourceDataUrl: z.string().min(1),
  scalingMode: z.enum(["fixedAspect", "nineSlice"]).default("fixedAspect"),
  slice: ButtonTemplateSliceSchema.optional(),
});
export type ButtonBaseDesign = z.infer<typeof ButtonBaseDesignSchema>;

export const ButtonStateContentTypeSchema = z.enum(["text", "pattern"]);
export type ButtonStateContentType = z.infer<typeof ButtonStateContentTypeSchema>;

export const ButtonStateOptionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  label: z.string().min(1),
  contentType: nullishToUndefined(ButtonStateContentTypeSchema),
  icon: nullishToUndefined(z.string().min(1)),
  baseTemplateId: nullishToUndefined(z.enum(["rounded", "pill", "beveled", "flat", "glass"])),
  patternTemplateId: nullishToUndefined(z.enum(["none", "gift", "check", "lock", "coin", "calendar", "star"])),
  baseDesign: nullishToUndefined(ButtonBaseDesignSchema),
  patternDesign: nullishToUndefined(StretchVisualDesignSchema),
  patternLayers: nullishToUndefined(z.array(ButtonPatternLayerSchema).min(1)),
  style: ComponentStyleSchema,
});
export type ButtonStateOption = z.infer<typeof ButtonStateOptionSchema>;

export const ButtonStateDesignSchema = z.object({
  defaultStateId: z.string().min(1),
  states: z.array(ButtonStateOptionSchema).min(1),
  stateSource: nullishToUndefined(z.object({
    apiKey: z.string().min(1),
    field: z.string().min(1).default("status"),
  })),
});
export type ButtonStateDesign = z.infer<typeof ButtonStateDesignSchema>;

export const ImageCropSchema = z.object({
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  width: z.number().positive().max(100),
  height: z.number().positive().max(100),
});
export type ImageCrop = z.infer<typeof ImageCropSchema>;

export const ImagePolygonPointSchema = z.object({
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
});
export type ImagePolygonPoint = z.infer<typeof ImagePolygonPointSchema>;

export const ButtonImageDesignSchema = z.object({
  sourceDataUrl: z.string().min(1),
  sourceName: nullishToUndefined(z.string().min(1)),
  crop: nullishToUndefined(ImageCropSchema),
  scanArea: nullishToUndefined(ImageCropSchema),
  imageFrame: nullishToUndefined(ButtonImageFrameSchema),
  polygonPoints: nullishToUndefined(z.array(ImagePolygonPointSchema)),
  whiteTolerance: nullishToUndefined(z.number().min(0).max(120)),
  renderWhiteTolerance: nullishToUndefined(z.number().min(-1).max(120)),
  outputDataUrl: nullishToUndefined(z.string().min(1)),
});
export type ButtonImageDesign = z.infer<typeof ButtonImageDesignSchema>;
`,
);

write(
  "ui/component/component-action.ts",
  `import { z } from "zod";
import { nullishToUndefined } from "../../system/schema-utils.js";

export const NavigateActionSchema = z.object({
  type: z.literal("navigate"),
  targetPageId: z.string().min(1),
  targetPath: z.string().min(1),
});

export const OpenPanelActionSchema = z.object({
  type: z.literal("openPanel"),
  panelId: z.string().min(1),
});

export const OpenModalActionSchema = z.object({
  type: z.literal("openModal"),
  modalId: z.string().min(1),
});

export const ApiActionSchema = z.object({
  type: z.literal("apiAction"),
  apiKey: z.string().min(1),
  params: nullishToUndefined(z.record(z.string(), z.string())),
  afterSuccess: nullishToUndefined(z.unknown()),
});

export const ClosePanelActionSchema = z.object({
  type: z.literal("closePanel"),
  panelId: nullishToUndefined(z.string().min(1)),
});

export const NoopActionSchema = z.object({
  type: z.literal("none"),
});

export const OpenSettingsActionSchema = z.object({
  type: z.literal("openSettings"),
});

export const LogoutActionSchema = z.object({
  type: z.literal("logout"),
});

export const ComponentActionSchema = z.discriminatedUnion("type", [
  NavigateActionSchema,
  OpenPanelActionSchema,
  OpenModalActionSchema,
  ApiActionSchema,
  ClosePanelActionSchema,
  OpenSettingsActionSchema,
  LogoutActionSchema,
  NoopActionSchema,
]);
export type ComponentAction = z.infer<typeof ComponentActionSchema>;
`,
);

write(
  "ui/component/button-component.ts",
  `import { z } from "zod";
import { nullishToUndefined } from "../../system/schema-utils.js";
import { ComponentActionSchema } from "./component-action.js";
import { ComponentBindingSchema, PlayerCurrencyRewardSchema, UiDataSourceSchema } from "./component-binding.js";
import { ComponentPositionSchema } from "./component-position.js";
import { ComponentStyleSchema, ComponentVisualEffectSchema } from "./component-style.js";
import {
  ButtonBaseDesignSchema,
  ButtonImageDesignSchema,
  ButtonStateDesignSchema,
} from "./button-design.js";

export const ButtonComponentSchema = z.object({
  id: z.string().min(1),
  type: z.literal("button"),
  label: z.string().min(1),
  icon: nullishToUndefined(z.string().min(1)),
  position: ComponentPositionSchema,
  style: nullishToUndefined(ComponentStyleSchema),
  baseDesign: nullishToUndefined(ButtonBaseDesignSchema),
  imageDesign: nullishToUndefined(ButtonImageDesignSchema),
  stateDesign: nullishToUndefined(ButtonStateDesignSchema),
  effect: nullishToUndefined(ComponentVisualEffectSchema),
  rewardGrant: nullishToUndefined(PlayerCurrencyRewardSchema),
  dataSource: nullishToUndefined(UiDataSourceSchema),
  binding: nullishToUndefined(ComponentBindingSchema),
  action: ComponentActionSchema,
});
export type ButtonComponent = z.infer<typeof ButtonComponentSchema>;
`,
);

write(
  "ui/component/panel-component.ts",
  `import { z } from "zod";
import { nullishToUndefined } from "../../system/schema-utils.js";
import { ComponentBindingSchema, UiDataSourceSchema } from "./component-binding.js";
import { ComponentPositionSchema } from "./component-position.js";
import { ComponentStyleSchema, ComponentVisualEffectSchema } from "./component-style.js";
import { PanelDecorationSchema } from "./stretch-visual-design.js";

export const PanelKindSchema = z.enum(["container", "surface", "stage", "group", "overlay"]);
export type PanelKind = z.infer<typeof PanelKindSchema>;

export const PanelContentSizeSchema = z.object({
  widthPercent: z.number().positive(),
  heightPercent: z.number().positive(),
});
export type PanelContentSize = z.infer<typeof PanelContentSizeSchema>;

export const LevelMapPathPointSchema = z.object({
  x: z.number().min(-25).max(175),
  y: z.number().min(-25).max(175),
});
export type LevelMapPathPoint = z.infer<typeof LevelMapPathPointSchema>;

export const LevelMapPathEdgeStyleTemplateSchema = z.enum(["plank", "rope", "dashed"]);
export type LevelMapPathEdgeStyleTemplate = z.infer<typeof LevelMapPathEdgeStyleTemplateSchema>;

export const LevelMapPathEdgeSchema = z.object({
  id: z.string().min(1),
  fromSuffix: z.string().min(1),
  toSuffix: z.string().min(1),
  waypoints: nullishToUndefined(z.array(LevelMapPathPointSchema)),
  style: nullishToUndefined(z.object({
    templateId: LevelMapPathEdgeStyleTemplateSchema.default("plank"),
    width: nullishToUndefined(z.number().positive().max(12)),
  })),
});
export type LevelMapPathEdge = z.infer<typeof LevelMapPathEdgeSchema>;

export const LevelMapPathDesignSchema = z.object({
  edges: z.array(LevelMapPathEdgeSchema).default([]),
});
export type LevelMapPathDesign = z.infer<typeof LevelMapPathDesignSchema>;

export const PanelFloatingSchema = z.object({
  anchorComponentId: z.string().min(1),
  placement: z.enum(["top", "right", "bottom", "left", "center"]),
  offsetX: z.number(),
  offsetY: z.number(),
});
export type PanelFloating = z.infer<typeof PanelFloatingSchema>;

export const PanelComponentSchema = z.object({
  id: z.string().min(1),
  type: z.literal("panel"),
  kind: nullishToUndefined(PanelKindSchema),
  panelRole: nullishToUndefined(z.enum(["static", "popover", "dataPanel", "workflowPanel"])),
  title: nullishToUndefined(z.string().min(1)),
  position: ComponentPositionSchema,
  style: nullishToUndefined(ComponentStyleSchema),
  decoration: nullishToUndefined(PanelDecorationSchema),
  effect: nullishToUndefined(ComponentVisualEffectSchema),
  contentSize: nullishToUndefined(PanelContentSizeSchema),
  pathDesign: nullishToUndefined(LevelMapPathDesignSchema),
  floating: nullishToUndefined(PanelFloatingSchema),
  dataSource: nullishToUndefined(UiDataSourceSchema),
  binding: nullishToUndefined(ComponentBindingSchema),
  childComponentIds: z.array(z.string().min(1)).default([]),
});
export type PanelComponent = z.infer<typeof PanelComponentSchema>;
`,
);

write(
  "ui/component/text-component.ts",
  `import { z } from "zod";
import { nullishToUndefined } from "../../system/schema-utils.js";
import {
  DynamicTextProgramSchema,
  TextContentModeSchema,
} from "../../ui-customization/dynamic-text-program.js";
import { ComponentBindingSchema } from "./component-binding.js";
import { ComponentPositionSchema } from "./component-position.js";
import { ComponentStyleSchema, TextArtDesignSchema } from "./component-style.js";

export const TextComponentSchema = z.object({
  id: z.string().min(1),
  type: z.literal("text"),
  text: z.string(),
  textContentMode: nullishToUndefined(TextContentModeSchema),
  dynamicTextProgram: nullishToUndefined(DynamicTextProgramSchema),
  position: ComponentPositionSchema,
  style: nullishToUndefined(ComponentStyleSchema),
  artTextDesign: nullishToUndefined(TextArtDesignSchema),
  binding: nullishToUndefined(ComponentBindingSchema),
});
export type TextComponent = z.infer<typeof TextComponentSchema>;
`,
);

write(
  "ui/component/list-component.ts",
  `import { z } from "zod";
import { nullishToUndefined } from "../../system/schema-utils.js";
import { ComponentBindingSchema } from "./component-binding.js";
import { ComponentPositionSchema } from "./component-position.js";
import { ComponentStyleSchema } from "./component-style.js";

export const ListComponentSchema = z.object({
  id: z.string().min(1),
  type: z.literal("list"),
  dataPath: z.string().min(1),
  itemTemplate: z.array(z.unknown()).default([]),
  emptyStateText: nullishToUndefined(z.string().min(1)),
  position: ComponentPositionSchema,
  style: nullishToUndefined(ComponentStyleSchema),
  binding: nullishToUndefined(ComponentBindingSchema),
});
export type ListComponent = z.infer<typeof ListComponentSchema>;
`,
);

write(
  "ui/component/widget-component.ts",
  `import { z } from "zod";
import { nullishToUndefined } from "../../system/schema-utils.js";
import { ComponentBindingSchema } from "./component-binding.js";
import { ComponentPositionSchema } from "./component-position.js";
import { ComponentStyleSchema } from "./component-style.js";

export const WidgetIdSchema = z.enum(["adminProposalReview", "levelMapStage"]);
export type WidgetId = z.infer<typeof WidgetIdSchema>;

export const WidgetComponentSchema = z.object({
  id: z.string().min(1),
  type: z.literal("widget"),
  widgetId: WidgetIdSchema,
  position: ComponentPositionSchema,
  style: nullishToUndefined(ComponentStyleSchema),
  binding: nullishToUndefined(ComponentBindingSchema),
});
export type WidgetComponent = z.infer<typeof WidgetComponentSchema>;
`,
);

write(
  "ui/component/page-component.ts",
  `import { z } from "zod";
import { ButtonComponentSchema } from "./button-component.js";
import { ListComponentSchema } from "./list-component.js";
import { PanelComponentSchema } from "./panel-component.js";
import { TextComponentSchema } from "./text-component.js";
import { WidgetComponentSchema } from "./widget-component.js";

export const PageComponentSchema = z.discriminatedUnion("type", [
  ButtonComponentSchema,
  PanelComponentSchema,
  TextComponentSchema,
  ListComponentSchema,
  WidgetComponentSchema,
]);
export type PageComponent = z.infer<typeof PageComponentSchema>;

export {
  ButtonComponentSchema,
  type ButtonComponent,
} from "./button-component.js";
export {
  PanelComponentSchema,
  type PanelComponent,
  LevelMapPathDesignSchema,
  type LevelMapPathDesign,
  LevelMapPathEdgeSchema,
  type LevelMapPathEdge,
  PanelDecorationSchema as PanelDecorationFromPanel,
} from "./panel-component.js";
export { TextComponentSchema, type TextComponent } from "./text-component.js";
export { ListComponentSchema, type ListComponent } from "./list-component.js";
export { WidgetComponentSchema, type WidgetComponent } from "./widget-component.js";
`,
);

write(
  "ui/page/page-layout.ts",
  `import { z } from "zod";
import { nullishToUndefined } from "../../system/schema-utils.js";

export const PageLayoutTypeSchema = z.enum(["stack", "grid", "freeform"]);
export type PageLayoutType = z.infer<typeof PageLayoutTypeSchema>;

export const PageLayoutSchema = z.object({
  type: PageLayoutTypeSchema,
  columns: nullishToUndefined(z.number().int().positive()),
  gap: nullishToUndefined(z.number().min(0)),
  padding: nullishToUndefined(z.number().min(0)),
});
export type PageLayout = z.infer<typeof PageLayoutSchema>;
`,
);

write(
  "ui/page/page-config.ts",
  `import { z } from "zod";
import { PageComponentSchema } from "../component/page-component.js";
import { PageLayoutSchema } from "./page-layout.js";

export const UiEndpointSchema = z.enum(["player", "designer", "admin", "director"]);
export type UiEndpoint = z.infer<typeof UiEndpointSchema>;

export const PageSurfaceModeSchema = z.enum(["composed", "staticEmbed"]).default("composed");
export type PageSurfaceMode = z.infer<typeof PageSurfaceModeSchema>;

export const PageConfigSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  path: z.string().min(1),
  roleScope: UiEndpointSchema,
  layout: PageLayoutSchema,
  surfaceMode: PageSurfaceModeSchema,
  components: z.array(PageComponentSchema),
});
export type PageConfig = z.infer<typeof PageConfigSchema>;
`,
);

// Barrel re-export for page-config consumers
write(
  "ui/page-config.ts",
  `export * from "./page/page-config.js";
export * from "./page/page-layout.js";
export * from "./component/page-component.js";
export * from "./component/component-position.js";
export * from "./component/component-style.js";
export * from "./component/component-action.js";
export * from "./component/component-binding.js";
export * from "./component/button-design.js";
export * from "./component/stretch-visual-design.js";
export * from "./component/button-component.js";
export * from "./component/panel-component.js";
export * from "./component/text-component.js";
export * from "./component/list-component.js";
export * from "./component/widget-component.js";
`,
);

fs.unlinkSync(path.join(objects, "ui-customization/page-config.ts"));

// Update ui-customization barrel
write(
  "ui-customization/ui-customization-objects.ts",
  `export * from "../ui/page-config.js";
export * from "../ui/button_template/button-template.js";
export * from "./dynamic-text-program.js";
export * from "./default-page-configs.js";
export * from "./preview-user.js";
export * from "./level-chain-home-structure.js";
export * from "./level-map-structure.js";
`,
);

// Fix ui-customization internal imports
const uiCustFiles = [
  "default-page-configs.ts",
  "admin-proposals-structure.ts",
  "level-chain-home-structure.ts",
  "preview-user.ts",
  "level-map-structure.ts",
  "page-config-normalizer.ts",
];
for (const f of uiCustFiles) {
  replaceInFile(`ui-customization/${f}`, [
    ['from "./page-config.js"', 'from "../ui/page-config.js"'],
  ]);
}

replaceInFile("level/level-background-template.ts", [
  ['from "../ui-customization/page-config.js"', 'from "../ui/component/stretch-visual-design.js"'],
]);

replaceInFile("objects/director-page/button-template-types.ts", [
  ['from "../../objects/ui-customization/template-category.js"', 'from "../ui/category/template-category.js"'],
]);

// --- Bulk import updates across frontend/src ---
const importReplacements = [
  ["objects/level/position.js", "objects/level/terrain/position.js"],
  ["objects/level/size.js", "objects/level/terrain/size.js"],
  ["objects/level/level-ground.js", "objects/level/terrain/level-ground.js"],
  ["objects/level/ground-line.js", "objects/level/terrain/ground-line.js"],
  ["objects/level/ground-bezier.js", "objects/level/terrain/ground-bezier.js"],
  ["objects/level/level-terrain.js", "objects/level/terrain/level-terrain.js"],
  ["objects/level/terrain-void-span.js", "objects/level/terrain/terrain-void-span.js"],
  ["objects/level/level-obstacle.js", "objects/level/terrain/level-obstacle.js"],
  ["objects/level/level-enemy.js", "objects/level/terrain/level-enemy.js"],
  ["objects/level/level.js", "objects/level/level/level.js"],
  ["objects/level/level-data.js", "objects/level/level/level-data.js"],
  ["objects/level/game-world.js", "objects/level/level/game-world.js"],
  ["objects/level/favorite.js", "objects/level/social/favorite.js"],
  ["objects/level/favorite-with-level.js", "objects/level/social/favorite-with-level.js"],
  ["objects/level/rating.js", "objects/level/social/rating.js"],
  ["objects/level/level-comment.js", "objects/level/social/level-comment.js"],
  ["objects/level/submission.js", "objects/level/submission/submission.js"],
  ["objects/level/submission-with-level.js", "objects/level/submission/submission-with-level.js"],
  ["objects/level/bird-pool.js", "objects/level/inventory/bird-pool.js"],
  ["objects/level/bird-inventory.js", "objects/level/inventory/bird-inventory.js"],
  ["objects/admin/review-audit.js", "objects/admin/submission/review-audit.js"],
  ["objects/admin/reviewed-submission.js", "objects/admin/submission/reviewed-submission.js"],
  ["objects/admin/director-permission-summary.js", "objects/admin/director/permissions/director-permission-summary.js"],
  ["objects/admin/director-transfer-result.js", "objects/admin/director/permissions/director-transfer-result.js"],
  ["objects/admin/level-slot-assignment.js", "objects/admin/director/level_assignment/assignment/level-slot-assignment.js"],
  ["objects/bird/bird-design.js", "objects/bird/design/bird-design.js"],
  ["objects/bird/bird-submission.js", "objects/bird/submission/bird-submission.js"],
  ["objects/bird/bird-skill-config.js", "objects/bird/skill/director/director-bird-skill-entry.js"],
  ["objects/player/shop-item.js", "objects/player/shop/shop-item.js"],
  ["objects/ui-customization/page-config.js", "objects/ui/page-config.js"],
  ["objects/ui-customization/button-template.js", "objects/ui/button_template/button-template.js"],
  ["objects/ui-customization/template-category.js", "objects/ui/category/template-category.js"],
  ["objects/ui-customization/stretch-visual-template.js", "objects/ui/stretch_template/stretch-visual-template.js"],
];

function walk(dir, callback) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules") continue;
      walk(full, callback);
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      callback(full);
    }
  }
}

walk(src, (file) => {
  let content = fs.readFileSync(file, "utf8");
  let changed = false;
  for (const [from, to] of importReplacements) {
    if (content.includes(from)) {
      content = content.split(from).join(to);
      changed = true;
    }
  }
  // DirectorLevelAssignmentBoard imports
  if (content.includes("DirectorLevelAssignmentBoardSchema") && file.includes("GetDirectorLevelAssignmentBoard")) {
    content = content.replace(
      /from "([^"]*level-slot-assignment\.js)"/,
      'from "$1"\n// board schemas',
    );
  }
  if (changed) fs.writeFileSync(file, content);
});

// Fix files that import board schemas from assignment file
const boardImportFixes = [
  "api/admin/director/level_assignment/GetDirectorLevelAssignmentBoardApi.ts",
  "page/director/DirectorLevelAssignmentPage.tsx",
  "api/api-contracts.ts",
];
for (const rel of boardImportFixes) {
  const full = path.join(src, rel);
  if (!fs.existsSync(full)) continue;
  let c = fs.readFileSync(full, "utf8");
  if (c.includes("DirectorLevelAssignmentBoard") && c.includes("level-slot-assignment")) {
    c = c.replace(
      /from "([^"]*level_assignment\/assignment\/level-slot-assignment\.js)"/g,
      (match, p) => {
        if (c.includes("DirectorLevelAssignmentBoardSchema")) {
          return `from "${p.replace("assignment/level-slot-assignment", "board/director-level-assignment-board")}"`;
        }
        return match;
      },
    );
    // More precise fix for mixed imports
    if (rel.includes("GetDirectorLevelAssignmentBoard")) {
      c = c.replace(
        /import \{([^}]*DirectorLevelAssignmentBoardSchema[^}]*)\} from "[^"]*level-slot-assignment[^"]*"/,
        'import { $1 } from "../../../../objects/admin/director/level_assignment/board/director-level-assignment-board.js"',
      );
    }
    if (rel.includes("DirectorLevelAssignmentPage")) {
      c = c.replace(
        /import type \{ DirectorLevelAssignmentBoard, LevelSlotAssignmentDetail \} from "[^"]*level-slot-assignment[^"]*"/,
        'import type { DirectorLevelAssignmentBoard } from "../../objects/admin/director/level_assignment/board/director-level-assignment-board.js";\nimport type { LevelSlotAssignmentDetail } from "../../objects/admin/director/level_assignment/assignment/level-slot-assignment.js"',
      );
    }
    if (rel.includes("api-contracts")) {
      c = c.replace(
        /DirectorLevelAssignmentBoardSchema,\n  LevelSlotAssignmentDetailSchema,\n  LevelSlotAssignmentSchema,\n  type DirectorLevelAssignmentBoard as DirectorLevelAssignmentBoardObject,\n  type LevelSlotAssignment as LevelSlotAssignmentObject,\n  type LevelSlotAssignmentDetail as LevelSlotAssignmentDetailObject,\n\} from "\.\.\/objects\/admin\/director\/level_assignment\/assignment\/level-slot-assignment\.js"/,
        `LevelSlotAssignmentDetailSchema,
  LevelSlotAssignmentSchema,
  type LevelSlotAssignment as LevelSlotAssignmentObject,
  type LevelSlotAssignmentDetail as LevelSlotAssignmentDetailObject,
} from "../objects/admin/director/level_assignment/assignment/level-slot-assignment.js";
import {
  DirectorLevelAssignmentBoardSchema,
  type DirectorLevelAssignmentBoard as DirectorLevelAssignmentBoardObject,
} from "../objects/admin/director/level_assignment/board/director-level-assignment-board.js"`,
      );
    }
    fs.writeFileSync(full, c);
  }
}

// Bird skill helpers imports
walk(src, (file) => {
  let content = fs.readFileSync(file, "utf8");
  const helperSymbols = ["parseBirdSkillSet", "createDefaultSkillSet", "cloneSkillSet", "updateStage", "updateSpec", "appendSpec", "removeSpec", "moveSpec", "createEmptySkillStage", "cloneSkillSpec"];
  const needsHelpers = helperSymbols.some((s) => content.includes(s) && content.includes("director-bird-skill-entry"));
  if (needsHelpers) {
    content = content.replace(
      /from "([^"]*director-bird-skill-entry\.js)"/g,
      (m, p) => {
        if (content.includes('bird-skill-helpers')) return m;
        return m;
      },
    );
    // Add helpers import for files importing helpers from entry
    if (content.match(/import \{[^}]*(parseBirdSkillSet|createDefaultSkillSet|cloneSkillSet)[^}]*\} from "[^"]*director-bird-skill-entry/)) {
      content = content.replace(
        /(import \{[^}]*(parseBirdSkillSet|createDefaultSkillSet|cloneSkillSet|updateStage|updateSpec|appendSpec|removeSpec|moveSpec|createEmptySkillStage|cloneSkillSpec)[^}]*\}) from "([^"]*director-bird-skill-entry\.js)"/,
        (full, imports, _sym, p) => {
          const base = p.replace("director-bird-skill-entry.js", "bird-skill-helpers.js");
          const entryPath = p;
          const entryImports = imports.replace(/parseBirdSkillSet|createDefaultSkillSet|cloneSkillSet|updateStage|updateSpec|appendSpec|removeSpec|moveSpec|createEmptySkillStage|cloneSkillSpec/g, "").replace(/,\s*,/g, ",").replace(/\{\s*,/, "{").replace(/,\s*\}/, "}");
          const helperList = imports.match(/(parseBirdSkillSet|createDefaultSkillSet|cloneSkillSet|updateStage|updateSpec|appendSpec|removeSpec|moveSpec|createEmptySkillStage|cloneSkillSpec)/g) || [];
          const typeImports = entryImports.includes("DirectorBirdSkillEntry") ? entryImports : "{ }";
          let result = `import type { DirectorBirdSkillEntry } from "${entryPath}";\nimport { ${helperList.join(", ")} } from "${base}"`;
          if (entryImports.match(/DirectorBirdSkillBoard/)) {
            result = `import { DirectorBirdSkillBoardSchema } from "${entryPath.replace("director-bird-skill-entry", "director-bird-skill-board")}";\n` + result;
          }
          return result;
        },
      );
      fs.writeFileSync(file, content);
    }
  }
});

// BirdPoolOption import fix
walk(src, (file) => {
  let content = fs.readFileSync(file, "utf8");
  if (content.includes("BirdPoolOption") && content.includes("level-slot-assignment")) {
    content = content.replace(
      /from "[^"]*level-slot-assignment\.js"/,
      'from "../../objects/admin/director/level_assignment/board/director-level-assignment-board.js"',
    );
    // fix relative paths based on file location - use generic replacement
    content = content.replace(
      /objects\/admin\/director\/level_assignment\/assignment\/level-slot-assignment\.js/g,
      "objects/admin/director/level_assignment/board/director-level-assignment-board.js",
    );
    if (content.includes("BirdPoolOption") && !content.includes("director-level-assignment-board")) {
      // manual path fix for BirdPoolConfigPanel
    }
    fs.writeFileSync(file, content);
  }
});

console.log("Migration complete.");
