import { useRef, useState } from "react";
import type { LevelData, LevelEnemy, LevelObstacle } from "../../../../../objects/level/level/level-data.js";
import { WORLD_HEIGHT, WORLD_WIDTH } from "../../../../../lib/game-engine/constants.js";
import {
  addEntityToSelection,
  addObstacleFromCorners,
  addPigFromCorners,
  canPlaceEntity,
  createObstacleFromCorners,
  createPigEntity,
  createPigFromCorners,
  getEnemyDiameter,
  getEntitiesInSelectionBox,
  getEntityBounds,
  getEntityById,
  getGroupTransformSnapshot,
  getSelectionFrame,
  getSelectionFrameFromHandle,
  getSelectionFrameFromSnapshot,
  getSelectionBounds,
  moveEntityTo,
  moveEntitiesByDelta,
  normalizeSelectionBox,
  rotateEntitiesAroundSelectionCenter,
  scaleEntitiesFromSelectionBounds,
  selectSingleEntity,
  snapEntityCenterToGrid,
  snapPointToGrid,
  toggleEntityInSelection,
  updateObstacleBounds,
  type EditorSelectionHandle,
  type EditorSelectionFrame,
  type EditorEntity,
  type EditorSelectionBox,
  type EditorTool,
} from "../../../../../lib/designer-level.js";
import {
  addTerrainVoidSpan,
  createTerrainBoundaryFromStroke,
  createTerrainVoidSpanFromStroke,
  getBoundaryEditorPoints,
  getLevelTerrain,
  isBoundaryBreakpointIndex,
  sampleBoundaryPathSegments,
  sampleTerrainPolygon,
  sampleGroundPath,
  updateTerrainBoundaryPoint,
  type GroundStrokeSimplifyConfig,
  type TerrainEditMode,
} from "../../../../../lib/ground.js";
import type { LevelBackgroundTemplate } from "../../../../../objects/level/level-background-template.js";
import type { StretchVisualDesign } from "../../../../../objects/ui-customization/ui-customization-objects.js";
import { LevelBackgroundStageLayer } from "../design/LevelBackgroundStageLayer.js";

type LevelEditorCanvasProps = {
  activeTool: EditorTool;
  levelData: LevelData;
  editorPhase: "ground" | "entities";
  selectedEntityIds: string[];
  primarySelectedEntityId: string | null;
  onChange: (nextLevelData: LevelData) => void;
  onSelectionChange: (entityIds: string[], primaryEntityId: string | null) => void;
  onToolChange: (tool: EditorTool) => void;
  onPointerWorldChange: (point: { x: number; y: number } | null) => void;
  gridVisible: boolean;
  gridSnapEnabled: boolean;
  gridSize: number;
  isSnapTemporarilyDisabled: boolean;
  groupSelectionRotationAngle: number;
  onGroupSelectionRotationAngleChange: (angle: number) => void;
  groupSelectionCenter: { x: number; y: number } | null;
  onGroupSelectionCenterChange: (center: { x: number; y: number } | null) => void;
  groupSelectionSize: { width: number; height: number } | null;
  onGroupSelectionSizeChange: (size: { width: number; height: number } | null) => void;
  groundEditEnabled: boolean;
  terrainEditMode: TerrainEditMode;
  groundStrokeSimplifyConfig: GroundStrokeSimplifyConfig;
  selectedGroundPointIndex: number | null;
  onGroundPointSelectionChange: (pointIndex: number | null) => void;
  selectedVoidSpanId: string | null;
  onVoidSpanSelectionChange: (voidSpanId: string | null) => void;
  entityEditingEnabled: boolean;
  readOnly?: boolean;
  levelBackgroundTemplate?: LevelBackgroundTemplate | null;
  levelBackgroundPanelDesign?: StretchVisualDesign | null;
  levelBackgroundCloudDesigns?: StretchVisualDesign[];
};

type DragState = {
  entityId: string;
  pointerId: number;
  mode: "move" | "resize";
  handle?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
};

type MarqueeState = {
  pointerId: number;
  start: { x: number; y: number };
  current: { x: number; y: number };
  appendToSelection: boolean;
};

type AlignmentLine = {
  orientation: "horizontal" | "vertical";
  value: number;
};

type PreviewState = {
  candidate: EditorEntity;
  isValid: boolean;
};

type CreationDragState = {
  pointerId: number;
  kind: "obstacle" | "pig";
  material?: "wood" | "stone" | "glass";
  start: { x: number; y: number };
  current: { x: number; y: number };
};

type GroupTransformState = {
  pointerId: number;
  mode: "move" | "scale" | "rotate";
  handle?: "center" | EditorSelectionHandle;
  startPoint: { x: number; y: number };
  startRotation: number;
  startAngle?: number;
  currentPoint?: { x: number; y: number };
  snapshot: NonNullable<ReturnType<typeof getGroupTransformSnapshot>>;
  frame: EditorSelectionFrame;
  currentFrame?: EditorSelectionFrame;
};

type GroundPointDragState = {
  pointerId: number;
  pointIndex: number;
};

type GroundDrawState = {
  pointerId: number;
  mode: TerrainEditMode;
  points: Array<{ x: number; y: number }>;
};

type ZoomMarqueeState = {
  pointerId: number;
  start: { x: number; y: number };
  current: { x: number; y: number };
};

type CanvasViewportState = {
  zoom: number;
  panX: number;
  panY: number;
};

const ALIGNMENT_THRESHOLD = 10;
const GROUND_DRAW_POINT_THRESHOLD = 28;
const SLINGSHOT_X_RATIO = 0.22;
const SLINGSHOT_Y_RATIO = 410 / 540;
const MIN_CANVAS_ZOOM = 1;
const MAX_CANVAS_ZOOM = 8;
const ZOOM_SLIDER_MIN = 0;
const ZOOM_SLIDER_MAX = 1000;
const ZOOM_SELECTION_MIN_SIZE = 16;
const ZOOM_FIT_PADDING = 24;
const ZOOM_SNAP_POINTS = [1, 2, 4, 8] as const;
const ZOOM_SNAP_THRESHOLD = 0.06;

const getZoomFromSliderValue = (sliderValue: number) => {
  const progress = clamp((sliderValue - ZOOM_SLIDER_MIN) / (ZOOM_SLIDER_MAX - ZOOM_SLIDER_MIN), 0, 1);
  return MIN_CANVAS_ZOOM * Math.exp(progress * Math.log(MAX_CANVAS_ZOOM / MIN_CANVAS_ZOOM));
};

const getSliderValueFromZoom = (zoom: number) => {
  const normalizedZoom = clamp(zoom, MIN_CANVAS_ZOOM, MAX_CANVAS_ZOOM);
  const progress = Math.log(normalizedZoom / MIN_CANVAS_ZOOM) / Math.log(MAX_CANVAS_ZOOM / MIN_CANVAS_ZOOM);
  return ZOOM_SLIDER_MIN + progress * (ZOOM_SLIDER_MAX - ZOOM_SLIDER_MIN);
};

const snapZoomToAnchor = (zoom: number) => {
  const nearestSnapPoint = ZOOM_SNAP_POINTS.reduce((closest, candidate) =>
    Math.abs(candidate - zoom) < Math.abs(closest - zoom) ? candidate : closest,
  );

  return Math.abs(nearestSnapPoint - zoom) / nearestSnapPoint <= ZOOM_SNAP_THRESHOLD
    ? nearestSnapPoint
    : zoom;
};

const getWorldPoint = (
  element: HTMLDivElement,
  levelData: LevelData,
  clientX: number,
  clientY: number,
  viewport: CanvasViewportState,
) => {
  const rect = element.getBoundingClientRect();
  const normalizedX = (clientX - rect.left - viewport.panX) / Math.max(1e-6, rect.width * viewport.zoom);
  const normalizedY = (clientY - rect.top - viewport.panY) / Math.max(1e-6, rect.height * viewport.zoom);
  const x = normalizedX * levelData.world.width;
  const y = normalizedY * levelData.world.height;
  return { x, y };
};

const rotateVector = (x: number, y: number, angle: number) => ({
  x: x * Math.cos(angle) - y * Math.sin(angle),
  y: x * Math.sin(angle) + y * Math.cos(angle),
});

const getObstacleBounds = (
  obstacle: Pick<LevelObstacle, "position" | "size" | "angle">,
  center = obstacle.position,
) => getEntityBounds({
  kind: "obstacle",
  entity: {
    id: "preview",
    material: "wood",
    ...obstacle,
    position: center,
  },
});

const getEnemyBounds = (
  enemy: Pick<LevelEnemy, "position" | "size">,
  center = enemy.position,
) => getEntityBounds({
  kind: "enemy",
  entity: {
    id: "preview",
    type: "pig",
    ...enemy,
    position: center,
  },
});

const findAlignment = (
  movingBounds: ReturnType<typeof getEntityBounds>,
  levelData: LevelData,
  entityId: string,
): { point: { x: number; y: number }; lines: AlignmentLine[] } => {
  let bestVerticalDelta = Number.POSITIVE_INFINITY;
  let bestHorizontalDelta = Number.POSITIVE_INFINITY;
  let verticalLine: AlignmentLine | null = null;
  let horizontalLine: AlignmentLine | null = null;

  const movingVerticalEdges = [movingBounds.left, movingBounds.centerX, movingBounds.right];
  const movingHorizontalEdges = [movingBounds.top, movingBounds.centerY, movingBounds.bottom];

  const otherBounds = [
    ...levelData.obstacles
      .filter((obstacle) => obstacle.id !== entityId)
      .map((obstacle) => getObstacleBounds(obstacle)),
    ...levelData.enemies
      .filter((enemy) => enemy.id !== entityId)
      .map((enemy) => getEnemyBounds(enemy)),
  ];

  for (const bounds of otherBounds) {
    const candidateVerticalEdges = [bounds.left, bounds.centerX, bounds.right];
    const candidateHorizontalEdges = [bounds.top, bounds.centerY, bounds.bottom];

    for (const movingValue of movingVerticalEdges) {
      for (const candidateValue of candidateVerticalEdges) {
        const delta = candidateValue - movingValue;
        if (Math.abs(delta) <= ALIGNMENT_THRESHOLD && Math.abs(delta) < Math.abs(bestVerticalDelta)) {
          bestVerticalDelta = delta;
          verticalLine = {
            orientation: "vertical",
            value: candidateValue,
          };
        }
      }
    }

    for (const movingValue of movingHorizontalEdges) {
      for (const candidateValue of candidateHorizontalEdges) {
        const delta = candidateValue - movingValue;
        if (Math.abs(delta) <= ALIGNMENT_THRESHOLD && Math.abs(delta) < Math.abs(bestHorizontalDelta)) {
          bestHorizontalDelta = delta;
          horizontalLine = {
            orientation: "horizontal",
            value: candidateValue,
          };
        }
      }
    }
  }

  return {
    point: {
      x: movingBounds.centerX + (Number.isFinite(bestVerticalDelta) ? bestVerticalDelta : 0),
      y: movingBounds.centerY + (Number.isFinite(bestHorizontalDelta) ? bestHorizontalDelta : 0),
    },
    lines: [verticalLine, horizontalLine].filter((line): line is AlignmentLine => line !== null),
  };
};

const normalizeAngleDelta = (angle: number) => {
  if (angle > Math.PI) {
    return angle - Math.PI * 2;
  }
  if (angle < -Math.PI) {
    return angle + Math.PI * 2;
  }
  return angle;
};

const toPercentX = (x: number, levelData: LevelData) => `${(x / levelData.world.width) * 100}%`;
const toPercentY = (y: number, levelData: LevelData) => `${(y / levelData.world.height) * 100}%`;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const clampViewport = (
  viewport: CanvasViewportState,
  width: number,
  height: number,
): CanvasViewportState => {
  if (viewport.zoom <= MIN_CANVAS_ZOOM) {
    return {
      zoom: MIN_CANVAS_ZOOM,
      panX: 0,
      panY: 0,
    };
  }

  const minPanX = width - width * viewport.zoom;
  const minPanY = height - height * viewport.zoom;
  return {
    zoom: clamp(viewport.zoom, MIN_CANVAS_ZOOM, MAX_CANVAS_ZOOM),
    panX: clamp(viewport.panX, minPanX, 0),
    panY: clamp(viewport.panY, minPanY, 0),
  };
};

export const LevelEditorCanvas = ({
  activeTool,
  levelData,
  editorPhase,
  selectedEntityIds,
  primarySelectedEntityId,
  onChange,
  onSelectionChange,
  onToolChange,
  onPointerWorldChange,
  gridVisible,
  gridSnapEnabled,
  gridSize,
  isSnapTemporarilyDisabled,
  groupSelectionRotationAngle,
  onGroupSelectionRotationAngleChange,
  groupSelectionCenter,
  onGroupSelectionCenterChange,
  groupSelectionSize,
  onGroupSelectionSizeChange,
  groundEditEnabled,
  terrainEditMode,
  groundStrokeSimplifyConfig,
  selectedGroundPointIndex,
  onGroundPointSelectionChange,
  selectedVoidSpanId,
  onVoidSpanSelectionChange,
  entityEditingEnabled,
  readOnly = false,
  levelBackgroundTemplate = null,
  levelBackgroundPanelDesign = null,
  levelBackgroundCloudDesigns = [],
}: LevelEditorCanvasProps) => {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const groupTransformStateRef = useRef<GroupTransformState | null>(null);
  const groundPointDragStateRef = useRef<GroundPointDragState | null>(null);
  const groundDrawStateRef = useRef<GroundDrawState | null>(null);
  const [alignmentLines, setAlignmentLines] = useState<AlignmentLine[]>([]);
  const [previewState, setPreviewState] = useState<PreviewState | null>(null);
  const [marqueeState, setMarqueeState] = useState<MarqueeState | null>(null);
  const [creationDragState, setCreationDragState] = useState<CreationDragState | null>(null);
  const [hoveredGroundPointIndex, setHoveredGroundPointIndex] = useState<number | null>(null);
  const [zoomMarqueeState, setZoomMarqueeState] = useState<ZoomMarqueeState | null>(null);
  const [canvasViewport, setCanvasViewport] = useState<CanvasViewportState>({
    zoom: 1,
    panX: 0,
    panY: 0,
  });
  const selectedObstacle = levelData.obstacles.find((obstacle) => obstacle.id === primarySelectedEntityId) ?? null;
  const selectedEnemy = levelData.enemies.find((enemy) => enemy.id === primarySelectedEntityId) ?? null;
  const terrain = getLevelTerrain(levelData);
  const activeBoundaryKind = terrainEditMode === "ceiling-boundary" ? "ceiling" : "ground";
  const activeBoundary = activeBoundaryKind === "ceiling" ? terrain.ceilingBoundary ?? null : terrain.groundBoundary;
  const groundEditorPoints = activeBoundary ? getBoundaryEditorPoints(activeBoundary) : [];
  const sampledGroundPath = activeBoundary ? sampleGroundPath(activeBoundary) : [];
  const sampledCeilingSegments = sampleBoundaryPathSegments(levelData, terrain.ceilingBoundary);
  const sampledGroundBoundarySegments = sampleBoundaryPathSegments(levelData, terrain.groundBoundary);
  const terrainPolygons = sampleTerrainPolygon(levelData, terrain).polygons;
  const derivedSelectionFrame = getSelectionFrame(levelData, selectedEntityIds, groupSelectionRotationAngle, groupSelectionCenter ?? undefined);
  const selectionFrame =
    selectedEntityIds.length > 1 && groupSelectionCenter && groupSelectionSize
      ? {
          centerX: groupSelectionCenter.x,
          centerY: groupSelectionCenter.y,
          width: groupSelectionSize.width,
          height: groupSelectionSize.height,
          rotation: groupSelectionRotationAngle,
        }
      : derivedSelectionFrame;
  const slingshotX = levelData.world.width * SLINGSHOT_X_RATIO;
  const slingshotY = levelData.world.height * SLINGSHOT_Y_RATIO;
  const isZoomed = canvasViewport.zoom > MIN_CANVAS_ZOOM + 1e-6;

  const buildAddPreview = (point: { x: number; y: number }, snapDisabled = false): PreviewState => {
    const candidate =
      activeTool === "add-pig"
        ? createPigEntity(point.x, point.y)
        : {
            kind: "obstacle" as const,
            entity: createObstacleFromCorners(
              levelData,
              activeTool.replace("add-", "") as "wood" | "stone" | "glass",
              point,
              point,
            ) ?? {
              id: "preview",
              material: activeTool.replace("add-", "") as "wood" | "stone" | "glass",
              position: point,
              angle: 0,
              size: { width: 8, height: 8 },
            },
          };
    let snappedCandidate: EditorEntity = candidate;
    if (gridSnapEnabled && !snapDisabled) {
      const snappedPosition = snapEntityCenterToGrid(levelData, candidate, candidate.entity.position, gridSize);
      snappedCandidate =
        candidate.kind === "obstacle"
          ? {
              kind: "obstacle",
              entity: {
                ...candidate.entity,
                position: snappedPosition,
              },
            }
          : {
              kind: "enemy",
              entity: {
                ...candidate.entity,
                position: snappedPosition,
              },
            };
    }

    return {
      candidate: snappedCandidate,
      isValid: canPlaceEntity(levelData, snappedCandidate),
    };
  };

  const handleCanvasPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (readOnly) {
      return;
    }

    if (!canvasRef.current) {
      return;
    }

    const point = getWorldPoint(canvasRef.current, levelData, event.clientX, event.clientY, canvasViewport);
    onPointerWorldChange(point);
    setAlignmentLines([]);
    onGroundPointSelectionChange(null);
    onVoidSpanSelectionChange(null);

    if (event.ctrlKey) {
      setPreviewState(null);
      setMarqueeState(null);
      setCreationDragState(null);
      setZoomMarqueeState({
        pointerId: event.pointerId,
        start: point,
        current: point,
      });
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }

    if (groundEditEnabled && !entityEditingEnabled) {
      groundDrawStateRef.current = {
        pointerId: event.pointerId,
        mode: terrainEditMode,
        points: [point],
      };
      setPreviewState(null);
      setMarqueeState(null);
      setCreationDragState(null);
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }

    if (activeTool === "add-wood" || activeTool === "add-stone" || activeTool === "add-glass" || activeTool === "add-pig") {
      if (!entityEditingEnabled) {
        return;
      }
      setCreationDragState({
        pointerId: event.pointerId,
        kind: activeTool === "add-pig" ? "pig" : "obstacle",
        ...(activeTool === "add-pig" ? {} : { material: activeTool.replace("add-", "") as "wood" | "stone" | "glass" }),
        start: point,
        current: point,
      });
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }

    if (activeTool === "select") {
      if (!entityEditingEnabled) {
        return;
      }
      setPreviewState(null);
      setMarqueeState({
        pointerId: event.pointerId,
        start: point,
        current: point,
        appendToSelection: event.shiftKey,
      });
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }

    onSelectionChange([], null);
  };

  const handleCanvasPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!canvasRef.current) {
      return;
    }

    const point = getWorldPoint(canvasRef.current, levelData, event.clientX, event.clientY, canvasViewport);
    onPointerWorldChange(point);

    if (zoomMarqueeState && zoomMarqueeState.pointerId === event.pointerId) {
      setZoomMarqueeState((current) => (current ? { ...current, current: point } : current));
      return;
    }

    if (groundDrawStateRef.current && groundDrawStateRef.current.pointerId === event.pointerId) {
      const previousPoint = groundDrawStateRef.current.points.at(-1);
      if (!previousPoint || Math.hypot(point.x - previousPoint.x, point.y - previousPoint.y) >= GROUND_DRAW_POINT_THRESHOLD) {
        groundDrawStateRef.current = {
          ...groundDrawStateRef.current,
          points: [...groundDrawStateRef.current.points, point],
        };
      }
      return;
    }

    if (creationDragState && creationDragState.pointerId === event.pointerId) {
      const snapDisabled = event.altKey || isSnapTemporarilyDisabled;
      const nextPoint = gridSnapEnabled && !snapDisabled
        ? snapPointToGrid(point, gridSize)
        : point;
      setCreationDragState((current) => (current ? { ...current, current: nextPoint } : current));
      if (creationDragState.kind === "pig") {
        const candidateEntity = createPigFromCorners(levelData, creationDragState.start, nextPoint);
        setPreviewState(
          candidateEntity
            ? {
                candidate: { kind: "enemy", entity: candidateEntity },
                isValid: canPlaceEntity(levelData, { kind: "enemy", entity: candidateEntity }),
              }
            : null,
        );
      } else {
        const candidateEntity = createObstacleFromCorners(
          levelData,
          creationDragState.material!,
          creationDragState.start,
          nextPoint,
        );
        setPreviewState(
          candidateEntity
            ? {
                candidate: { kind: "obstacle", entity: candidateEntity },
                isValid: canPlaceEntity(levelData, { kind: "obstacle", entity: candidateEntity }),
              }
            : null,
        );
      }
      return;
    }

    if (marqueeState && marqueeState.pointerId === event.pointerId) {
      setMarqueeState((current) => (current ? { ...current, current: point } : current));
      return;
    }

    if (dragStateRef.current) {
      return;
    }

    if (readOnly) {
      setPreviewState(null);
      return;
    }

    if (activeTool === "add-wood" || activeTool === "add-stone" || activeTool === "add-glass" || activeTool === "add-pig") {
      setPreviewState(buildAddPreview(point, event.altKey || isSnapTemporarilyDisabled));
      return;
    }

    setPreviewState(null);
  };

  const handleCanvasPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (readOnly) {
      return;
    }

    if (zoomMarqueeState && zoomMarqueeState.pointerId === event.pointerId && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const zoomBox = normalizeSelectionBox(zoomMarqueeState.start, zoomMarqueeState.current);
      const widthInWorld = zoomBox.maxX - zoomBox.minX;
      const heightInWorld = zoomBox.maxY - zoomBox.minY;

      if (widthInWorld >= ZOOM_SELECTION_MIN_SIZE && heightInWorld >= ZOOM_SELECTION_MIN_SIZE) {
        const availableWidth = Math.max(1, rect.width - ZOOM_FIT_PADDING * 2);
        const availableHeight = Math.max(1, rect.height - ZOOM_FIT_PADDING * 2);
        const widthInPixels = (widthInWorld / levelData.world.width) * rect.width;
        const heightInPixels = (heightInWorld / levelData.world.height) * rect.height;
        const nextZoom = clamp(
          Math.min(availableWidth / Math.max(1e-6, widthInPixels), availableHeight / Math.max(1e-6, heightInPixels)),
          MIN_CANVAS_ZOOM,
          MAX_CANVAS_ZOOM,
        );
        const selectedMinXPx = (zoomBox.minX / levelData.world.width) * rect.width;
        const selectedMinYPx = (zoomBox.minY / levelData.world.height) * rect.height;
        const nextViewport = clampViewport(
          {
            zoom: nextZoom,
            panX: (rect.width - widthInPixels * nextZoom) / 2 - selectedMinXPx * nextZoom,
            panY: (rect.height - heightInPixels * nextZoom) / 2 - selectedMinYPx * nextZoom,
          },
          rect.width,
          rect.height,
        );
        setCanvasViewport(nextViewport);
      }

      setZoomMarqueeState(null);
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      return;
    }

    if (groundDrawStateRef.current && groundDrawStateRef.current.pointerId === event.pointerId) {
      if (groundDrawStateRef.current.mode === "hollow") {
        const nextVoidSpan = createTerrainVoidSpanFromStroke(levelData, groundDrawStateRef.current.points);
        if (nextVoidSpan) {
          onChange(addTerrainVoidSpan(levelData, nextVoidSpan));
          onVoidSpanSelectionChange(nextVoidSpan.id);
        }
      } else {
        const boundaryKind = groundDrawStateRef.current.mode === "ceiling-boundary" ? "ceiling" : "ground";
        let nextLevelData = createTerrainBoundaryFromStroke(
          levelData,
          boundaryKind,
          groundDrawStateRef.current.points,
          groundStrokeSimplifyConfig,
        );
        onChange(nextLevelData);
      }
      groundDrawStateRef.current = null;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      return;
    }

    if (creationDragState && creationDragState.pointerId === event.pointerId) {
      onChange(
        creationDragState.kind === "pig"
          ? addPigFromCorners(levelData, creationDragState.start, creationDragState.current)
          : addObstacleFromCorners(
              levelData,
              creationDragState.material!,
              creationDragState.start,
              creationDragState.current,
            ),
      );
      setCreationDragState(null);
      setPreviewState(null);
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      return;
    }

    if (!marqueeState || marqueeState.pointerId !== event.pointerId) {
      return;
    }

    const nextSelectionBox = normalizeSelectionBox(marqueeState.start, marqueeState.current);
    const entityIds = getEntitiesInSelectionBox(levelData, nextSelectionBox);
    const nextSelectedIds = marqueeState.appendToSelection
      ? entityIds.reduce((selectedIds, entityId) => addEntityToSelection(selectedIds, entityId), selectedEntityIds)
      : entityIds;
    const nextPrimaryEntityId = entityIds.at(-1) ?? (marqueeState.appendToSelection ? primarySelectedEntityId : null);

    onSelectionChange(nextSelectedIds, nextPrimaryEntityId);
    setMarqueeState(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleEntityPointerDown = (entityId: string) => (event: React.PointerEvent<HTMLButtonElement>) => {
    if (readOnly || !entityEditingEnabled) {
      event.stopPropagation();
      return;
    }

    if (activeTool === "add-wood" || activeTool === "add-stone" || activeTool === "add-glass" || activeTool === "add-pig") {
      onToolChange("select");
      onSelectionChange(selectSingleEntity(entityId), entityId);
      setPreviewState(null);
      event.stopPropagation();
      return;
    }

    if (activeTool === "rotate" || activeTool === "select") {
      if (event.shiftKey) {
        const nextSelectedIds = toggleEntityInSelection(selectedEntityIds, entityId);
        onSelectionChange(nextSelectedIds, nextSelectedIds.includes(entityId) ? entityId : nextSelectedIds.at(-1) ?? null);
      } else {
        onSelectionChange(selectSingleEntity(entityId), entityId);
      }
      event.stopPropagation();
    }
  };

  const handleSelectionMoveStart = (entityId: string) => (event: React.PointerEvent<HTMLButtonElement>) => {
    if (readOnly || !entityEditingEnabled) {
      event.stopPropagation();
      return;
    }

    if (selectedEntityIds.length > 1) {
      event.stopPropagation();
      return;
    }

    dragStateRef.current = {
      entityId,
      pointerId: event.pointerId,
      mode: "move",
    };
    setPreviewState(null);
    event.currentTarget.setPointerCapture(event.pointerId);
    event.stopPropagation();
  };

  const handleSelectionResizeStart =
    (entityId: string, handle: NonNullable<DragState["handle"]>) =>
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (readOnly || !entityEditingEnabled) {
        event.stopPropagation();
        return;
      }

      if (selectedEntityIds.length > 1) {
        event.stopPropagation();
        return;
      }

      dragStateRef.current = {
        entityId,
        pointerId: event.pointerId,
        mode: "resize",
        handle,
      };
      setAlignmentLines([]);
      setPreviewState(null);
      event.currentTarget.setPointerCapture(event.pointerId);
      event.stopPropagation();
    };

  const handleSelectionPointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (readOnly || !entityEditingEnabled) {
      return;
    }

    if (!canvasRef.current || !dragStateRef.current || dragStateRef.current.pointerId !== event.pointerId) {
      return;
    }

    const rawPoint = getWorldPoint(canvasRef.current, levelData, event.clientX, event.clientY, canvasViewport);
    const snapDisabled = event.altKey || isSnapTemporarilyDisabled;
    const point =
      gridSnapEnabled && !snapDisabled
        ? snapEntityCenterToGrid(
            levelData,
            getEntityById(levelData, dragStateRef.current.entityId) ?? createPigEntity(rawPoint.x, rawPoint.y),
            rawPoint,
            gridSize,
          )
        : rawPoint;

    if (dragStateRef.current.mode === "move") {
      const movingEntity = getEntityById(levelData, dragStateRef.current.entityId);
      if (!movingEntity) {
        return;
      }

      const movingBounds = getEntityBounds({
        ...movingEntity,
        entity: {
          ...movingEntity.entity,
          position: point,
        } as EditorEntity["entity"],
      } as EditorEntity);
      const alignment = snapDisabled ? { point, lines: [] } : findAlignment(movingBounds, levelData, dragStateRef.current.entityId);
      setAlignmentLines(alignment.lines);
      const candidate: EditorEntity = {
        ...movingEntity,
        entity: {
          ...movingEntity.entity,
          position: alignment.point,
        } as EditorEntity["entity"],
      } as EditorEntity;
      setPreviewState({
        candidate,
        isValid: canPlaceEntity(levelData, candidate, dragStateRef.current.entityId),
      });
      onChange(moveEntityTo(levelData, dragStateRef.current.entityId, alignment.point.x, alignment.point.y));
      event.stopPropagation();
      return;
    }

    const obstacle = levelData.obstacles.find((item) => item.id === dragStateRef.current?.entityId);
    if (!obstacle || !dragStateRef.current.handle) {
      return;
    }

    const angle = obstacle.angle ?? 0;
    const localPoint = rotateVector(
      point.x - obstacle.position.x,
      point.y - obstacle.position.y,
      -angle,
    );
    const halfWidth = obstacle.size.width / 2;
    const halfHeight = obstacle.size.height / 2;
    const oppositeCorner =
      dragStateRef.current.handle === "top-left"
        ? { x: halfWidth, y: halfHeight }
        : dragStateRef.current.handle === "top-right"
          ? { x: -halfWidth, y: halfHeight }
          : dragStateRef.current.handle === "bottom-left"
            ? { x: halfWidth, y: -halfHeight }
            : { x: -halfWidth, y: -halfHeight };

    const minHalfExtent = 4;
    const clampedDraggedCorner = {
      x:
        dragStateRef.current.handle === "top-left" || dragStateRef.current.handle === "bottom-left"
          ? Math.min(localPoint.x, oppositeCorner.x - minHalfExtent * 2)
          : Math.max(localPoint.x, oppositeCorner.x + minHalfExtent * 2),
      y:
        dragStateRef.current.handle === "top-left" || dragStateRef.current.handle === "top-right"
          ? Math.min(localPoint.y, oppositeCorner.y - minHalfExtent * 2)
          : Math.max(localPoint.y, oppositeCorner.y + minHalfExtent * 2),
    };

    const nextCenterLocal = {
      x: (clampedDraggedCorner.x + oppositeCorner.x) / 2,
      y: (clampedDraggedCorner.y + oppositeCorner.y) / 2,
    };
    const nextHalfSize = {
      width: Math.max(minHalfExtent, Math.abs(clampedDraggedCorner.x - oppositeCorner.x) / 2),
      height: Math.max(minHalfExtent, Math.abs(clampedDraggedCorner.y - oppositeCorner.y) / 2),
    };
    const nextCenterOffset = rotateVector(nextCenterLocal.x, nextCenterLocal.y, angle);
    const nextCenter = {
      x: obstacle.position.x + nextCenterOffset.x,
      y: obstacle.position.y + nextCenterOffset.y,
    };

    setAlignmentLines([]);
    const candidate: EditorEntity = {
      kind: "obstacle",
      entity: {
        ...obstacle,
        position: nextCenter,
        size: {
          width: nextHalfSize.width * 2,
          height: nextHalfSize.height * 2,
        },
        angle,
      },
    };
    setPreviewState({
      candidate,
      isValid: canPlaceEntity(levelData, candidate, obstacle.id),
    });
    onChange(
      updateObstacleBounds(
        levelData,
        obstacle.id,
        nextCenter.x,
        nextCenter.y,
        nextHalfSize.width * 2,
        nextHalfSize.height * 2,
      ),
    );
    event.stopPropagation();
  };

  const handleGroupTransformStart =
    (handle: "center" | EditorSelectionHandle, mode: GroupTransformState["mode"]) =>
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (readOnly || !entityEditingEnabled) {
        event.stopPropagation();
        return;
      }

      const snapshot = getGroupTransformSnapshot(levelData, selectedEntityIds);
      const frame = snapshot
        ? getSelectionFrameFromSnapshot(snapshot, groupSelectionRotationAngle, groupSelectionCenter ?? undefined)
        : null;
      if (!snapshot || !frame || selectedEntityIds.length < 2 || !canvasRef.current) {
        event.stopPropagation();
        return;
      }

      const selectionCenter = {
        x: frame.centerX,
        y: frame.centerY,
      };
    const startPoint = getWorldPoint(canvasRef.current, levelData, event.clientX, event.clientY, canvasViewport);
      groupTransformStateRef.current = {
        pointerId: event.pointerId,
        mode,
        handle,
        startPoint,
        startRotation: groupSelectionRotationAngle,
        snapshot,
        frame,
        ...(mode === "rotate"
          ? {
              startAngle: Math.atan2(startPoint.y - selectionCenter.y, startPoint.x - selectionCenter.x),
              currentPoint: startPoint,
            }
          : {}),
      };
      setAlignmentLines([]);
      setPreviewState(null);
      event.currentTarget.setPointerCapture(event.pointerId);
      event.stopPropagation();
    };

  const handleGroupTransformPointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (readOnly || !entityEditingEnabled) {
      return;
    }

    if (!canvasRef.current || !groupTransformStateRef.current || groupTransformStateRef.current.pointerId !== event.pointerId) {
      return;
    }

    const rawPoint = getWorldPoint(canvasRef.current, levelData, event.clientX, event.clientY, canvasViewport);
    const snapDisabled = event.altKey || isSnapTemporarilyDisabled;
    const point = gridSnapEnabled && !snapDisabled
      ? snapPointToGrid(rawPoint, gridSize)
      : rawPoint;
    const { snapshot, frame } = groupTransformStateRef.current;
    const selectionCenter = {
      x: frame.centerX,
      y: frame.centerY,
    };

    if (groupTransformStateRef.current.mode === "move") {
      const startCenter = {
        x: selectionCenter.x,
        y: selectionCenter.y,
      };
      const targetCenter = {
        x: startCenter.x + (point.x - groupTransformStateRef.current.startPoint.x),
        y: startCenter.y + (point.y - groupTransformStateRef.current.startPoint.y),
      };
      const snappedTargetCenter = gridSnapEnabled && !snapDisabled
        ? snapPointToGrid(targetCenter, gridSize)
        : targetCenter;
      const nextFrame = {
        ...frame,
        centerX: snappedTargetCenter.x,
        centerY: snappedTargetCenter.y,
      };
      groupTransformStateRef.current = {
        ...groupTransformStateRef.current,
        currentPoint: point,
        currentFrame: nextFrame,
      };

      onChange(
        moveEntitiesByDelta(
          levelData,
          snapshot,
          snappedTargetCenter.x - startCenter.x,
          snappedTargetCenter.y - startCenter.y,
        ),
      );
      onGroupSelectionCenterChange({
        x: snappedTargetCenter.x,
        y: snappedTargetCenter.y,
      });
      event.stopPropagation();
      return;
    }

    if (groupTransformStateRef.current.mode === "rotate") {
      const currentAngle = Math.atan2(point.y - selectionCenter.y, point.x - selectionCenter.x);
      const startAngle = groupTransformStateRef.current.startAngle ?? currentAngle;
      const deltaAngle = normalizeAngleDelta(currentAngle - startAngle);
      const nextRotation = normalizeAngleDelta(groupTransformStateRef.current.startRotation + deltaAngle);
      groupTransformStateRef.current = {
        ...groupTransformStateRef.current,
        currentPoint: point,
        currentFrame: {
          ...frame,
          rotation: nextRotation,
        },
      };
      onChange(
        rotateEntitiesAroundSelectionCenter(
          levelData,
          snapshot,
          {
            x: frame.centerX,
            y: frame.centerY,
          },
          deltaAngle,
        ),
      );
      onGroupSelectionRotationAngleChange(nextRotation);
      event.stopPropagation();
      return;
    }

    if (!groupTransformStateRef.current.handle || groupTransformStateRef.current.handle === "center") {
      return;
    }

    const nextFrame = getSelectionFrameFromHandle(
      frame,
      groupTransformStateRef.current.handle,
      point,
    );
    groupTransformStateRef.current = {
      ...groupTransformStateRef.current,
      currentPoint: point,
      currentFrame: nextFrame,
    };

    onChange(scaleEntitiesFromSelectionBounds(levelData, snapshot, frame, nextFrame));
    onGroupSelectionCenterChange({
      x: nextFrame.centerX,
      y: nextFrame.centerY,
    });
    onGroupSelectionSizeChange({
      width: nextFrame.width,
      height: nextFrame.height,
    });
    event.stopPropagation();
  };

  const handleGroupTransformPointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!groupTransformStateRef.current || groupTransformStateRef.current.pointerId !== event.pointerId) {
      return;
    }

    groupTransformStateRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    event.stopPropagation();
  };

  const handleGroundPointPointerDown =
    (pointIndex: number) =>
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (readOnly || !groundEditEnabled) {
        event.stopPropagation();
        return;
      }

      groundPointDragStateRef.current = {
        pointerId: event.pointerId,
        pointIndex,
      };
      onGroundPointSelectionChange(pointIndex);
      event.currentTarget.setPointerCapture(event.pointerId);
      event.stopPropagation();
    };

  const handleGroundPointPointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (
      readOnly
      || !groundEditEnabled
      || !canvasRef.current
      || !groundPointDragStateRef.current
      || groundPointDragStateRef.current.pointerId !== event.pointerId
    ) {
      return;
    }

    const point = getWorldPoint(canvasRef.current, levelData, event.clientX, event.clientY, canvasViewport);
    onChange(updateTerrainBoundaryPoint(levelData, activeBoundaryKind, groundPointDragStateRef.current.pointIndex, point));
    event.stopPropagation();
  };

  const handleGroundPointPointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (
      !groundPointDragStateRef.current
      || groundPointDragStateRef.current.pointerId !== event.pointerId
    ) {
      return;
    }

    groundPointDragStateRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    event.stopPropagation();
  };

  const handleSelectionPointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragStateRef.current || dragStateRef.current.pointerId !== event.pointerId) {
      return;
    }

    dragStateRef.current = null;
    setAlignmentLines([]);
    setPreviewState(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    event.stopPropagation();
  };

  const handleCanvasWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (!canvasRef.current || !isZoomed) {
      return;
    }

    event.stopPropagation();
    event.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    const deltaX = event.shiftKey ? event.deltaY : event.deltaX;
    const deltaY = event.shiftKey ? 0 : event.deltaY;
    setCanvasViewport((current) =>
      clampViewport(
        {
          ...current,
          panX: current.panX - deltaX,
          panY: current.panY - deltaY,
        },
        rect.width,
        rect.height,
      ));
  };

  const handleResetZoom = () => {
    setCanvasViewport({
      zoom: 1,
      panX: 0,
      panY: 0,
    });
  };

  const handleZoomSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!canvasRef.current) {
      return;
    }

    const rect = canvasRef.current.getBoundingClientRect();
    const nextZoom = snapZoomToAnchor(getZoomFromSliderValue(Number(event.target.value)));
    setCanvasViewport((current) => {
      const viewportCenterX = (rect.width / 2 - current.panX) / Math.max(1e-6, current.zoom);
      const viewportCenterY = (rect.height / 2 - current.panY) / Math.max(1e-6, current.zoom);
      return clampViewport(
        {
          zoom: nextZoom,
          panX: rect.width / 2 - viewportCenterX * nextZoom,
          panY: rect.height / 2 - viewportCenterY * nextZoom,
        },
        rect.width,
        rect.height,
      );
    });
  };

  const marqueeBox: EditorSelectionBox | null = marqueeState
    ? normalizeSelectionBox(marqueeState.start, marqueeState.current)
    : null;
  const zoomMarqueeBox: EditorSelectionBox | null = zoomMarqueeState
    ? normalizeSelectionBox(zoomMarqueeState.start, zoomMarqueeState.current)
    : null;
  const groupFrameRotation =
    groupTransformStateRef.current?.mode === "rotate" && groupTransformStateRef.current.snapshot
      ? normalizeAngleDelta(
          Math.atan2(
            (groupTransformStateRef.current.currentPoint?.y ?? groupTransformStateRef.current.startPoint.y) - groupTransformStateRef.current.frame.centerY,
            (groupTransformStateRef.current.currentPoint?.x ?? groupTransformStateRef.current.startPoint.x) - groupTransformStateRef.current.frame.centerX,
          ) - (groupTransformStateRef.current.startAngle ?? 0) + groupTransformStateRef.current.startRotation,
        )
      : groupSelectionRotationAngle;
  const groupFrame = groupTransformStateRef.current?.frame && selectedEntityIds.length > 1
    ? (
        groupTransformStateRef.current.mode === "rotate"
          ? (groupTransformStateRef.current.currentFrame ?? {
              ...groupTransformStateRef.current.frame,
              rotation: groupFrameRotation,
            })
          : (groupTransformStateRef.current.currentFrame ?? groupTransformStateRef.current.frame)
      )
    : selectionFrame;
  const creationBox: EditorSelectionBox | null = creationDragState && previewState
    ? (() => {
        const bounds = getEntityBounds(previewState.candidate);
        return {
          minX: bounds.left,
          minY: bounds.top,
          maxX: bounds.right,
          maxY: bounds.bottom,
        };
      })()
    : creationDragState
      ? normalizeSelectionBox(creationDragState.start, creationDragState.current)
      : null;
  const groundPath = sampledGroundPath
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
  const topGroundPath = sampledCeilingSegments
    .map((segment) => segment.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" "))
    .join(" ");
  const bottomGroundPath = sampledGroundBoundarySegments
    .map((segment) => segment.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" "))
    .join(" ");
  const groundDrawPreviewPath = groundDrawStateRef.current
    ? groundDrawStateRef.current.points
        .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
        .join(" ")
    : "";
  const groundDrawReplaceRange = groundDrawStateRef.current && groundDrawStateRef.current.points.length > 0
    ? {
        minX: Math.min(...groundDrawStateRef.current.points.map((point) => point.x)),
        maxX: Math.max(...groundDrawStateRef.current.points.map((point) => point.x)),
      }
    : null;
  const groundControlPath = groundEditorPoints
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
  const sceneLabel =
    editorPhase === "entities"
      ? "实体搭建视图"
      : terrainEditMode === "hollow"
        ? "地形 / 虚空段"
        : !activeBoundary
          ? "天花板 / 未创建"
          : activeBoundary.type === "line"
            ? `${activeBoundaryKind === "ceiling" ? "天花板" : "地面"} / 折线`
            : `${activeBoundaryKind === "ceiling" ? "天花板" : "地面"} / 贝塞尔`;
  const sceneMetaLabel =
    editorPhase === "entities"
      ? `地形填充区域 ${terrainPolygons.length}`
      : `填充区域 ${terrainPolygons.length}`;

  return (
    <section className="designer-canvas-section">
      <div className="card-header">
        <strong>编辑画布</strong>
        <span>
          {selectedEntityIds.length === 0
            ? "未选中对象"
            : selectedEntityIds.length === 1
              ? `已选中：${primarySelectedEntityId}`
              : `已选中 ${selectedEntityIds.length} 个，主对象：${primarySelectedEntityId}`}
        </span>
      </div>
      <div
        ref={canvasRef}
        className={`designer-editor-canvas tool-${activeTool} ${readOnly ? "read-only" : ""}${levelBackgroundTemplate ? " has-level-background" : ""}`}
        style={{
          aspectRatio: `${levelData.world.width} / ${levelData.world.height}`,
          overscrollBehavior: isZoomed ? "contain" : "auto",
        }}
        onPointerDown={handleCanvasPointerDown}
        onPointerMove={handleCanvasPointerMove}
        onPointerUp={handleCanvasPointerUp}
        onPointerCancel={handleCanvasPointerUp}
        onWheel={isZoomed ? handleCanvasWheel : undefined}
        onPointerLeave={() => {
          onPointerWorldChange(null);
          setPreviewState(null);
          setAlignmentLines([]);
          setCreationDragState(null);
        }}
      >
        <div
          className="designer-canvas-stage"
          style={{
            transform: `translate(${canvasViewport.panX}px, ${canvasViewport.panY}px) scale(${canvasViewport.zoom})`,
          }}
        >
          {levelBackgroundTemplate ? (
            <LevelBackgroundStageLayer
              template={levelBackgroundTemplate}
              panelBackgroundDesign={levelBackgroundPanelDesign}
              cloudPatternDesigns={levelBackgroundCloudDesigns}
              width={levelData.world.width}
              height={levelData.world.height}
            />
          ) : null}
          {gridVisible ? (
            <div
              className="designer-grid-overlay"
              style={{
                backgroundSize: `${(gridSize / levelData.world.width) * 100}% ${(gridSize / levelData.world.height) * 100}%`,
              }}
            />
          ) : null}
          <svg
            className="designer-ground-path-layer"
            viewBox={`0 0 ${levelData.world.width} ${levelData.world.height}`}
            preserveAspectRatio="none"
            aria-hidden="true"
          >
          {groundDrawReplaceRange ? (
            <rect
              x={groundDrawReplaceRange.minX}
              y={0}
              width={Math.max(0, groundDrawReplaceRange.maxX - groundDrawReplaceRange.minX)}
              height={levelData.world.height}
              className="designer-ground-replace-range"
            />
          ) : null}
          {terrainPolygons.map((polygon, index) => (
            <polygon
              key={`terrain-fill-${index}`}
              points={polygon.map((point) => `${point.x},${point.y}`).join(" ")}
              className="designer-terrain-fill"
            />
          ))}
          {groundDrawPreviewPath ? (
            <path d={groundDrawPreviewPath} className="designer-ground-draw-preview" />
          ) : null}
          {activeBoundary?.type === "bezier" && groundEditEnabled && terrainEditMode !== "hollow" ? (
            <path d={groundControlPath} className="designer-ground-control-path" />
          ) : null}
          <path d={topGroundPath} className={`designer-terrain-top-stroke ${terrainEditMode === "ceiling-boundary" ? "active" : ""}`} />
          <path d={bottomGroundPath} className={`designer-terrain-bottom-stroke ${terrainEditMode === "ground-boundary" ? "active" : ""}`} />
          {terrain.voidSpans.map((span) => (
            <rect
              key={span.id}
              x={span.startX}
              y={0}
              width={Math.max(0, span.endX - span.startX)}
              height={levelData.world.height}
              className={`designer-terrain-void-span-stroke ${selectedVoidSpanId === span.id ? "selected" : ""}`}
              onPointerDown={(event) => {
                if (readOnly || !groundEditEnabled || terrainEditMode !== "hollow") {
                  return;
                }
                onVoidSpanSelectionChange(span.id);
                event.stopPropagation();
              }}
            />
          ))}
          </svg>
          {groundEditEnabled && terrainEditMode !== "hollow" ? (
            <svg
              className="designer-ground-point-layer"
              viewBox={`0 0 ${levelData.world.width} ${levelData.world.height}`}
              preserveAspectRatio="none"
              aria-hidden="true"
            >
            {groundEditorPoints.map((point, index) => (
              <g key={`ground-visual-point-${index}`}>
                {isBoundaryBreakpointIndex(levelData, activeBoundary, index) ? (
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={12.5}
                    className="designer-ground-breakpoint-ring"
                  />
                ) : null}
                {hoveredGroundPointIndex === index && selectedGroundPointIndex !== index ? (
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={8.6}
                    className="designer-ground-node-hover-halo"
                  />
                ) : null}
                {selectedGroundPointIndex === index ? (
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={10.5}
                    className="designer-ground-node-halo"
                  />
                ) : null}
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={selectedGroundPointIndex === index ? 7.5 : 4}
                  className={`designer-ground-node ${activeBoundary?.type === "bezier" ? "bezier" : "line"} ${isBoundaryBreakpointIndex(levelData, activeBoundary, index) ? "breakpoint" : ""} ${selectedGroundPointIndex === index ? "selected" : ""}`}
                />
              </g>
            ))}
            </svg>
          ) : null}
          <div className="designer-ground-label">
          <span>{sceneLabel}</span>
          <span>{sceneMetaLabel}</span>
          </div>
          <div
            className="designer-slingshot-guide"
            style={{
              left: toPercentX(slingshotX, levelData),
              top: toPercentY(slingshotY, levelData),
            }}
          >
          <div className="designer-slingshot-post" />
          <div className="designer-slingshot-band left" />
          <div className="designer-slingshot-band right" />
          <span>Slingshot</span>
          </div>
          {alignmentLines.map((line) => (
          <div
            key={`${line.orientation}-${line.value}`}
            className={`designer-alignment-line ${line.orientation}`}
            style={
              line.orientation === "vertical"
                ? { left: `${(line.value / levelData.world.width) * 100}%` }
                : { top: `${(line.value / levelData.world.height) * 100}%` }
            }
          />
          ))}
          {previewState ? (
          previewState.candidate.kind === "obstacle" ? (
            <div
              className={`designer-placement-preview obstacle ${previewState.candidate.entity.material} ${previewState.isValid ? "valid" : "invalid"}`}
              style={{
                left: `${(previewState.candidate.entity.position.x / levelData.world.width) * 100}%`,
                top: `${(previewState.candidate.entity.position.y / levelData.world.height) * 100}%`,
                width: `${(previewState.candidate.entity.size.width / levelData.world.width) * 100}%`,
                height: `${(previewState.candidate.entity.size.height / levelData.world.height) * 100}%`,
                transform: `translate(-50%, -50%) rotate(${previewState.candidate.entity.angle ?? 0}rad)`,
              }}
            />
          ) : (
            <div
              className={`designer-placement-preview pig ${previewState.isValid ? "valid" : "invalid"}`}
              style={{
                left: `${(previewState.candidate.entity.position.x / levelData.world.width) * 100}%`,
                top: `${(previewState.candidate.entity.position.y / levelData.world.height) * 100}%`,
                width: `${(getEnemyDiameter(previewState.candidate.entity) / levelData.world.width) * 100}%`,
                aspectRatio: "1 / 1",
              }}
            />
          )
          ) : null}
          {creationBox ? (
          <div
            className="designer-marquee-selection designer-create-selection"
            style={{
              left: `${(creationBox.minX / levelData.world.width) * 100}%`,
              top: `${(creationBox.minY / levelData.world.height) * 100}%`,
              width: `${((creationBox.maxX - creationBox.minX) / levelData.world.width) * 100}%`,
              height: `${((creationBox.maxY - creationBox.minY) / levelData.world.height) * 100}%`,
            }}
          />
          ) : null}
          {marqueeBox ? (
          <div
            className="designer-marquee-selection"
            style={{
              left: `${(marqueeBox.minX / levelData.world.width) * 100}%`,
              top: `${(marqueeBox.minY / levelData.world.height) * 100}%`,
              width: `${((marqueeBox.maxX - marqueeBox.minX) / levelData.world.width) * 100}%`,
              height: `${((marqueeBox.maxY - marqueeBox.minY) / levelData.world.height) * 100}%`,
            }}
          />
          ) : null}
          {levelData.obstacles.map((obstacle) => (
          <button
            key={obstacle.id}
            type="button"
            className={`designer-entity obstacle ${obstacle.material} ${selectedEntityIds.includes(obstacle.id) ? "selected" : ""} ${primarySelectedEntityId === obstacle.id ? "primary" : ""}`}
            style={{
              left: `${(obstacle.position.x / levelData.world.width) * 100}%`,
              top: `${(obstacle.position.y / levelData.world.height) * 100}%`,
              width: `${(obstacle.size.width / levelData.world.width) * 100}%`,
              height: `${(obstacle.size.height / levelData.world.height) * 100}%`,
              transform: `translate(-50%, -50%) rotate(${obstacle.angle ?? 0}rad)`,
            }}
            onPointerDown={handleEntityPointerDown(obstacle.id)}
          >
          </button>
          ))}
          {levelData.enemies.map((enemy) => (
          <button
            key={enemy.id}
            type="button"
            className={`designer-entity pig ${selectedEntityIds.includes(enemy.id) ? "selected" : ""} ${primarySelectedEntityId === enemy.id ? "primary" : ""}`}
            style={{
              left: `${(enemy.position.x / levelData.world.width) * 100}%`,
              top: `${(enemy.position.y / levelData.world.height) * 100}%`,
              width: `${(getEnemyDiameter(enemy) / levelData.world.width) * 100}%`,
              aspectRatio: "1 / 1",
              transform: "translate(-50%, -50%)",
            }}
            onPointerDown={handleEntityPointerDown(enemy.id)}
          >
          </button>
          ))}
          {groundEditEnabled && terrainEditMode !== "hollow" ? groundEditorPoints.map((point, index) => (
          <button
            key={`ground-point-${index}`}
            type="button"
            className={`designer-ground-point ${activeBoundary?.type === "bezier" ? "bezier" : "line"} ${selectedGroundPointIndex === index ? "selected" : ""}`}
            style={{
              left: toPercentX(point.x, levelData),
              top: toPercentY(point.y, levelData),
            }}
            onPointerDown={handleGroundPointPointerDown(index)}
            onPointerMove={handleGroundPointPointerMove}
            onPointerUp={handleGroundPointPointerUp}
            onPointerCancel={handleGroundPointPointerUp}
            onPointerEnter={() => setHoveredGroundPointIndex(index)}
            onPointerLeave={() => setHoveredGroundPointIndex((current) => (current === index ? null : current))}
            title={isBoundaryBreakpointIndex(levelData, activeBoundary, index)
              ? `断点 ${index + 1}：该点会切分实体段，中间未连接区域将视为空洞`
              : `${activeBoundary?.type === "line" ? "point" : "control point"} ${index + 1}`}
          />
          )) : null}
          {groupFrame && selectedEntityIds.length > 1 ? (
          <div
            className="designer-group-selection-frame"
            style={{
              left: `${(groupFrame.centerX / levelData.world.width) * 100}%`,
              top: `${(groupFrame.centerY / levelData.world.height) * 100}%`,
              width: `${(groupFrame.width / levelData.world.width) * 100}%`,
              height: `${(groupFrame.height / levelData.world.height) * 100}%`,
              transform: `translate(-50%, -50%) rotate(${groupFrame.rotation}rad)`,
            }}
          >
            <button
              type="button"
              className="designer-selection-handle center"
              onPointerDown={handleGroupTransformStart("center", "move")}
              onPointerMove={handleGroupTransformPointerMove}
              onPointerUp={handleGroupTransformPointerUp}
              onPointerCancel={handleGroupTransformPointerUp}
            />
            {(["top-left", "top-right", "bottom-left", "bottom-right"] as const).map((handle) => (
              <button
                key={handle}
                type="button"
                className={`designer-selection-handle ${handle}`}
                onPointerDown={handleGroupTransformStart(handle, "scale")}
                onPointerMove={handleGroupTransformPointerMove}
                onPointerUp={handleGroupTransformPointerUp}
                onPointerCancel={handleGroupTransformPointerUp}
              />
            ))}
            {activeTool === "rotate" ? (
              <button
                type="button"
                className="designer-selection-handle rotation"
                onPointerDown={handleGroupTransformStart("top-left", "rotate")}
                onPointerMove={handleGroupTransformPointerMove}
                onPointerUp={handleGroupTransformPointerUp}
                onPointerCancel={handleGroupTransformPointerUp}
              />
            ) : null}
          </div>
          ) : null}
          {selectedObstacle && selectedEntityIds.length === 1 ? (
          <div
            className="designer-selection-frame"
            style={{
              left: `${(selectedObstacle.position.x / levelData.world.width) * 100}%`,
              top: `${(selectedObstacle.position.y / levelData.world.height) * 100}%`,
              width: `${(selectedObstacle.size.width / levelData.world.width) * 100}%`,
              height: `${(selectedObstacle.size.height / levelData.world.height) * 100}%`,
              transform: `translate(-50%, -50%) rotate(${selectedObstacle.angle ?? 0}rad)`,
            }}
          >
            <button
              type="button"
              className="designer-selection-handle center"
              onPointerDown={handleSelectionMoveStart(selectedObstacle.id)}
              onPointerMove={handleSelectionPointerMove}
              onPointerUp={handleSelectionPointerUp}
              onPointerCancel={handleSelectionPointerUp}
            />
            {(["top-left", "top-right", "bottom-left", "bottom-right"] as const).map((handle) => (
              <button
                key={handle}
                type="button"
                className={`designer-selection-handle ${handle}`}
                onPointerDown={handleSelectionResizeStart(selectedObstacle.id, handle)}
                onPointerMove={handleSelectionPointerMove}
                onPointerUp={handleSelectionPointerUp}
                onPointerCancel={handleSelectionPointerUp}
              />
            ))}
          </div>
          ) : null}
          {selectedEnemy && selectedEntityIds.length === 1 ? (
          <div
            className="designer-selection-frame pig-selection-frame"
            style={{
              left: `${(selectedEnemy.position.x / levelData.world.width) * 100}%`,
              top: `${(selectedEnemy.position.y / levelData.world.height) * 100}%`,
              width: `${(getEnemyDiameter(selectedEnemy) / levelData.world.width) * 100}%`,
              aspectRatio: "1 / 1",
              transform: "translate(-50%, -50%)",
            }}
          >
            <button
              type="button"
              className="designer-selection-handle center"
              onPointerDown={handleSelectionMoveStart(selectedEnemy.id)}
              onPointerMove={handleSelectionPointerMove}
              onPointerUp={handleSelectionPointerUp}
              onPointerCancel={handleSelectionPointerUp}
            />
          </div>
          ) : null}
        </div>
        {zoomMarqueeBox ? (
          <div
            className="designer-marquee-selection designer-zoom-selection"
            style={{
              left: `${(zoomMarqueeBox.minX / levelData.world.width) * 100 * canvasViewport.zoom + (canvasViewport.panX / Math.max(1, canvasRef.current?.clientWidth ?? 1)) * 100}%`,
              top: `${(zoomMarqueeBox.minY / levelData.world.height) * 100 * canvasViewport.zoom + (canvasViewport.panY / Math.max(1, canvasRef.current?.clientHeight ?? 1)) * 100}%`,
              width: `${((zoomMarqueeBox.maxX - zoomMarqueeBox.minX) / levelData.world.width) * 100 * canvasViewport.zoom}%`,
              height: `${((zoomMarqueeBox.maxY - zoomMarqueeBox.minY) / levelData.world.height) * 100 * canvasViewport.zoom}%`,
            }}
          />
        ) : null}
      </div>
      <div className="designer-canvas-zoom-panel">
        <strong>{`${Math.round(canvasViewport.zoom * 100)}%`}</strong>
        <div className="designer-canvas-zoom-controls">
          <input
            type="range"
            className="designer-canvas-zoom-slider"
            min={ZOOM_SLIDER_MIN}
            max={ZOOM_SLIDER_MAX}
            step={1}
            value={getSliderValueFromZoom(canvasViewport.zoom)}
            aria-label="调整设计画布局部放大倍率"
            onChange={handleZoomSliderChange}
          />
          <div className="designer-canvas-zoom-ticks" aria-hidden="true">
            {ZOOM_SNAP_POINTS.map((zoomPoint) => (
              <span
                key={zoomPoint}
                className={`designer-canvas-zoom-tick ${Math.abs(canvasViewport.zoom - zoomPoint) < 1e-6 ? "active" : ""}`}
                style={{
                  left: `${((getSliderValueFromZoom(zoomPoint) - ZOOM_SLIDER_MIN) / (ZOOM_SLIDER_MAX - ZOOM_SLIDER_MIN)) * 100}%`,
                }}
              >
                {`${zoomPoint * 100}%`}
              </span>
            ))}
          </div>
        </div>
        <button
          type="button"
          className="secondary"
          onClick={handleResetZoom}
        >
          复位
        </button>
      </div>
    </section>
  );
};
