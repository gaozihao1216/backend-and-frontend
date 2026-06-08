import { z } from "zod";
import { nullishToUndefined } from "../system/schema-utils.js";
import {
  DynamicTextProgramSchema,
  TextContentModeSchema,
} from "./dynamic-text-program.js";
import { ButtonTemplateSliceSchema } from "./button-template.js";

export const UiEndpointSchema = z.enum(["player", "designer", "admin", "director"]);
export type UiEndpoint = z.infer<typeof UiEndpointSchema>;

export const PageLayoutTypeSchema = z.enum(["stack", "grid", "freeform"]);
export type PageLayoutType = z.infer<typeof PageLayoutTypeSchema>;

export const PageLayoutSchema = z.object({
  type: PageLayoutTypeSchema,
  columns: nullishToUndefined(z.number().int().positive()),
  gap: nullishToUndefined(z.number().min(0)),
  padding: nullishToUndefined(z.number().min(0)),
});
export type PageLayout = z.infer<typeof PageLayoutSchema>;

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

export const PageComponentSchema = z.discriminatedUnion("type", [
  ButtonComponentSchema,
  PanelComponentSchema,
  TextComponentSchema,
  ListComponentSchema,
  WidgetComponentSchema,
]);
export type PageComponent = z.infer<typeof PageComponentSchema>;

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
