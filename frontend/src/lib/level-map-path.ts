import { getPageConfig } from "./ui-customization.js";
import { saveSharedLevelMapPage } from "./shared-level-map-persistence.js";
import {
  getLevelSuffixFromNodeButton,
  isLevelNodeButtonComponent,
} from "./level-node-button-format.js";
import { findStagePanel } from "./level-stage-structure.js";
import {
  createDefaultLevelMapPathDesign,
  LEVEL_MAP_PAGE_ID,
  LEVEL_NODE_DEFINITIONS,
} from "../objects/ui-customization/level-map-structure.js";
import {
  readLevelProgressPayload,
  resolveLevelNodeStateFromUiData,
  type LevelNodeProgressStateId,
} from "./level-node-progress.js";
import type {
  ButtonComponent,
  ComponentPosition,
  LevelMapPathDesign,
  LevelMapPathEdge,
  LevelMapPathPoint,
  PageComponent,
  PageConfig,
  PanelContentSize,
} from "../objects/ui-customization/ui-customization-objects.js";

export type LevelMapCanvasSize = {
  widthPercent: number;
  heightPercent: number;
};

export const DEFAULT_LEVEL_MAP_CANVAS_SIZE: LevelMapCanvasSize = {
  widthPercent: 150,
  heightPercent: 125,
};

/** @deprecated Use resolveLevelMapCanvasSize(contentSize) for viewBox dimensions */
export const LEVEL_MAP_CANVAS_WIDTH = DEFAULT_LEVEL_MAP_CANVAS_SIZE.widthPercent;
/** @deprecated Use resolveLevelMapCanvasSize(contentSize) for viewBox dimensions */
export const LEVEL_MAP_CANVAS_HEIGHT = DEFAULT_LEVEL_MAP_CANVAS_SIZE.heightPercent;

export const resolveLevelMapCanvasSize = (
  contentSize?: PanelContentSize,
): LevelMapCanvasSize =>
  contentSize
    ? {
        widthPercent: contentSize.widthPercent,
        heightPercent: contentSize.heightPercent,
      }
    : { widthPercent: 100, heightPercent: 100 };

/** Convert button/path CSS percent coords into SVG canvas units (viewBox space). */
export const percentPointToCanvasSvgPoint = (
  point: LevelMapPathPoint,
  canvasSize: LevelMapCanvasSize,
): LevelMapPathPoint => ({
  x: (point.x * canvasSize.widthPercent) / 100,
  y: (point.y * canvasSize.heightPercent) / 100,
});

export const percentPointsToCanvasSvgPoints = (
  points: LevelMapPathPoint[],
  canvasSize: LevelMapCanvasSize,
): LevelMapPathPoint[] => points.map((point) => percentPointToCanvasSvgPoint(point, canvasSize));

export const LEVEL_MAP_PATH_EDGE_STYLE_META: ReadonlyArray<{
  id: NonNullable<LevelMapPathEdge["style"]>["templateId"];
  label: string;
}> = [
  { id: "plank", label: "木板桥" },
  { id: "rope", label: "绳索" },
  { id: "dashed", label: "虚线" },
];

/** Plank-bridge: long edges parallel to the path, planks side-by-side across the deck. */
export const LEVEL_MAP_BRIDGE_TEMPLATE = {
  longEdgeLength: 3.6,
  shortEdgeWidth: 0.48,
  planksAcross: 5,
  cornerRadius: 0.08,
  gapAlongPath: 0.16,
  gapAcrossDeck: 0.1,
  minPlankCount: 2,
} as const;

export type PlankBridgePlacement = {
  x: number;
  y: number;
  rotation: number;
  variant: 0 | 1;
  showEndSeam: boolean;
};

export const getScaledBridgePlankLayout = (widthScale = 1) => {
  const longEdgeLength = LEVEL_MAP_BRIDGE_TEMPLATE.longEdgeLength * widthScale;
  const shortEdgeWidth = LEVEL_MAP_BRIDGE_TEMPLATE.shortEdgeWidth * widthScale;

  return {
    longEdgeLength,
    shortEdgeWidth,
    planksAcross: LEVEL_MAP_BRIDGE_TEMPLATE.planksAcross,
    radius: LEVEL_MAP_BRIDGE_TEMPLATE.cornerRadius * widthScale,
    gapAlongPath: LEVEL_MAP_BRIDGE_TEMPLATE.gapAlongPath * widthScale,
    gapAcrossDeck: LEVEL_MAP_BRIDGE_TEMPLATE.gapAcrossDeck * widthScale,
    plankRowStep: (shortEdgeWidth + LEVEL_MAP_BRIDGE_TEMPLATE.gapAcrossDeck * widthScale),
    halfLongEdgeLength: longEdgeLength / 2,
    halfShortEdgeWidth: shortEdgeWidth / 2,
    shadowOffsetY: 0.06 * widthScale,
    shineHeight: 0.16 * widthScale,
  };
};

export const getBridgeWoodGradientId = (
  visualState: LevelMapPathEdgeVisualState,
  variant: 0 | 1 = 0,
): string => {
  const tone = variant === 1 ? "-alt" : "";

  switch (visualState) {
    case "inactive":
      return `level-map-bridge-wood-inactive${tone}`;
    case "pending":
      return `level-map-bridge-wood-pending${tone}`;
    default:
      return `level-map-bridge-wood-active${tone}`;
  }
};

export type LevelMapPathEdgeVisualState = "inactive" | "pending" | "active" | "cleared";

export const createDefaultChainEdges = (): LevelMapPathEdge[] =>
  createDefaultLevelMapPathDesign().edges;

export const getDefaultLevelMapPathDesign = (): LevelMapPathDesign =>
  createDefaultLevelMapPathDesign();

export const getStagePanelPathDesign = (pageConfig: PageConfig): LevelMapPathDesign => {
  const stagePanel = findStagePanel(pageConfig);
  return stagePanel?.pathDesign ?? getDefaultLevelMapPathDesign();
};

export const applyLevelMapPathDesign = (
  pageConfig: PageConfig,
  pathDesign: LevelMapPathDesign,
): PageConfig => ({
  ...pageConfig,
  components: pageConfig.components.map((component) =>
    component.type === "panel" && component.kind === "stage"
      ? { ...component, pathDesign }
      : component,
  ),
});

export const getLevelMapPathDesignFromStore = (): LevelMapPathDesign => {
  const pageConfig = getPageConfig(LEVEL_MAP_PAGE_ID);
  if (!pageConfig) {
    return getDefaultLevelMapPathDesign();
  }

  return getStagePanelPathDesign(pageConfig);
};

export const syncLevelMapPathDesign = (pathDesign: LevelMapPathDesign): PageConfig[] => {
  const pageConfig = getPageConfig(LEVEL_MAP_PAGE_ID);
  if (!pageConfig) {
    return [];
  }

  return [saveSharedLevelMapPage(applyLevelMapPathDesign(pageConfig, pathDesign))];
};

export const getLevelNodeAnchorPoint = (position: ComponentPosition): LevelMapPathPoint => ({
  x: position.x + position.width / 2,
  y: position.y + position.height / 2,
});

export const getLevelNodeButtonBySuffix = (
  componentMap: Map<string, PageComponent>,
  levelSuffix: string,
): ButtonComponent | null => {
  for (const component of componentMap.values()) {
    if (isLevelNodeButtonComponent(component) && getLevelSuffixFromNodeButton(component) === levelSuffix) {
      return component;
    }
  }

  return null;
};

export const resolveEdgeAnchorPoints = (
  edge: LevelMapPathEdge,
  componentMap: Map<string, PageComponent>,
): { from: LevelMapPathPoint; to: LevelMapPathPoint } | null => {
  const fromButton = getLevelNodeButtonBySuffix(componentMap, edge.fromSuffix);
  const toButton = getLevelNodeButtonBySuffix(componentMap, edge.toSuffix);
  if (!fromButton || !toButton) {
    return null;
  }

  return {
    from: getLevelNodeAnchorPoint(fromButton.position),
    to: getLevelNodeAnchorPoint(toButton.position),
  };
};

export const buildEdgePolyline = (
  from: LevelMapPathPoint,
  to: LevelMapPathPoint,
  waypoints: LevelMapPathPoint[] = [],
): LevelMapPathPoint[] => [from, ...waypoints, to];

const distanceBetween = (left: LevelMapPathPoint, right: LevelMapPathPoint) =>
  Math.hypot(right.x - left.x, right.y - left.y);

export const buildPlankBridgePlacements = (
  from: LevelMapPathPoint,
  to: LevelMapPathPoint,
  waypoints: LevelMapPathPoint[] = [],
  widthScale = 1,
): PlankBridgePlacement[] => {
  const layout = getScaledBridgePlankLayout(widthScale);
  const points = buildEdgePolyline(from, to, waypoints);
  const placements: PlankBridgePlacement[] = [];

  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index]!;
    const end = points[index + 1]!;
    const deltaX = end.x - start.x;
    const deltaY = end.y - start.y;
    const distance = distanceBetween(start, end);

    if (distance < 0.01) {
      continue;
    }

    const angle = (Math.atan2(deltaY, deltaX) * 180) / Math.PI;
    const unitX = deltaX / distance;
    const unitY = deltaY / distance;
    const perpX = -unitY;
    const perpY = unitX;
    const step = layout.longEdgeLength + layout.gapAlongPath;
    const columnCount = Math.max(
      LEVEL_MAP_BRIDGE_TEMPLATE.minPlankCount,
      Math.ceil((distance + layout.gapAlongPath) / step),
    );
    const span = columnCount * layout.longEdgeLength + (columnCount - 1) * layout.gapAlongPath;
    const lead = (distance - span) / 2 + layout.halfLongEdgeLength;

    for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
      const centerDistance = lead + columnIndex * step;
      const centerX = start.x + unitX * centerDistance;
      const centerY = start.y + unitY * centerDistance;

      for (let rowIndex = 0; rowIndex < layout.planksAcross; rowIndex += 1) {
        const lateralOffset =
          (rowIndex - (layout.planksAcross - 1) / 2) * layout.plankRowStep;

        placements.push({
          x: centerX + perpX * lateralOffset,
          y: centerY + perpY * lateralOffset,
          rotation: angle,
          variant: ((columnIndex + rowIndex) % 2) as 0 | 1,
          showEndSeam: columnIndex < columnCount - 1,
        });
      }
    }
  }

  return placements;
};

/** @deprecated Use buildPlankBridgePlacements */
export const buildPlankSegmentTransforms = buildPlankBridgePlacements;

export const resolveEdgeVisualState = (
  edge: LevelMapPathEdge,
  uiData: Record<string, unknown>,
): LevelMapPathEdgeVisualState => {
  const fromState = resolveLevelNodeStateFromUiData(edge.fromSuffix, uiData);
  const toState = resolveLevelNodeStateFromUiData(edge.toSuffix, uiData);

  if (fromState !== "cleared") {
    return "inactive";
  }

  if (toState === "cleared") {
    return "cleared";
  }

  if (toState === "notCleared") {
    return "active";
  }

  return "pending";
};

export const readClearedLevelSuffixes = (uiData: Record<string, unknown>): Set<string> => {
  const payload = readLevelProgressPayload(uiData);
  if (!payload) {
    return new Set();
  }

  return new Set(
    Object.entries(payload.levels)
      .filter(([, state]) => state === "cleared")
      .map(([suffix]) => suffix),
  );
};

export const createLevelMapPathEdge = (
  fromSuffix: string,
  toSuffix: string,
  edges: LevelMapPathEdge[],
): LevelMapPathEdge | null => {
  if (fromSuffix === toSuffix) {
    return null;
  }

  const duplicate = edges.some(
    (edge) => edge.fromSuffix === fromSuffix && edge.toSuffix === toSuffix,
  );
  if (duplicate) {
    return null;
  }

  return {
    id: `${fromSuffix}-to-${toSuffix}-${Date.now().toString(36)}`,
    fromSuffix,
    toSuffix,
    style: { templateId: "plank" },
  };
};

export const updateLevelMapPathEdge = (
  pathDesign: LevelMapPathDesign,
  edgeId: string,
  patch: Partial<LevelMapPathEdge>,
): LevelMapPathDesign => ({
  ...pathDesign,
  edges: pathDesign.edges.map((edge) =>
    edge.id === edgeId ? { ...edge, ...patch } : edge,
  ),
});

export const removeLevelMapPathEdge = (
  pathDesign: LevelMapPathDesign,
  edgeId: string,
): LevelMapPathDesign => ({
  ...pathDesign,
  edges: pathDesign.edges.filter((edge) => edge.id !== edgeId),
});

export const formatLevelMapEdgeLabel = (edge: LevelMapPathEdge): string => {
  const from = LEVEL_NODE_DEFINITIONS.find((level) => level.suffix === edge.fromSuffix);
  const to = LEVEL_NODE_DEFINITIONS.find((level) => level.suffix === edge.toSuffix);
  return `${from?.label ?? edge.fromSuffix} → ${to?.label ?? edge.toSuffix}`;
};

export const getLevelSuffixLabel = (suffix: string): string =>
  LEVEL_NODE_DEFINITIONS.find((level) => level.suffix === suffix)?.label ?? suffix;
