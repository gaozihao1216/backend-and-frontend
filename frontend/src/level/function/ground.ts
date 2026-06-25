import type { LevelData } from "../../objects/level/level/level-data.js";
import type { LevelGround } from "../../objects/level/terrain/level-ground.js";
import type { LevelTerrain, TerrainVoidSpan } from "../../objects/level/terrain/level-terrain.js";
import type { Position } from "../../objects/level/terrain/position.js";

const DEFAULT_GROUND_OFFSET = 48;
const MIN_CONTROL_POINT_GAP = 24;
const MAX_DRAWN_GROUND_POINTS = 24;
const DEFAULT_BOUNDARY_BREAKPOINT_EPSILON = 24;
let boundaryBreakpointEpsilon = DEFAULT_BOUNDARY_BREAKPOINT_EPSILON;

export type GroundSamplePoint = Position;
export type GroundStrokeSimplifyConfig = {
  minSpan: number;
  angleWeight: number;
  stopEpsilon: number;
};
export type TerrainBoundaryKind = "ceiling" | "ground";
export type TerrainEditMode = "ceiling-boundary" | "ground-boundary" | "hollow";
export type TerrainPolygonSample = {
  polygons: Position[][];
};
export type TerrainCollisionSample = {
  topSegments: Array<[Position, Position]>;
  bottomSegments: Array<[Position, Position]>;
  voidSegments: Array<[Position, Position]>;
};

export const DEFAULT_GROUND_STROKE_SIMPLIFY_CONFIG: GroundStrokeSimplifyConfig = {
  minSpan: MIN_CONTROL_POINT_GAP,
  angleWeight: 1.35,
  stopEpsilon: 0.5,
};

export const getBoundaryBreakpointEpsilon = () => boundaryBreakpointEpsilon;

export const setBoundaryBreakpointEpsilon = (nextValue: number) => {
  boundaryBreakpointEpsilon = Math.max(0, nextValue);
};

export const resetBoundaryBreakpointEpsilon = () => {
  boundaryBreakpointEpsilon = DEFAULT_BOUNDARY_BREAKPOINT_EPSILON;
};

export const getDefaultBoundaryBreakpointEpsilon = () => DEFAULT_BOUNDARY_BREAKPOINT_EPSILON;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const lerp = (start: number, end: number, t: number) => start + (end - start) * t;

const clonePoint = (point: Position): Position => ({ x: point.x, y: point.y });

const isCloseTo = (value: number, target: number, epsilon = 1e-6) => Math.abs(value - target) <= epsilon;

const projectEndpointToWorldBoundary = (
  levelData: Pick<LevelData, "world">,
  point: Position,
  endpoint: "start" | "end",
): Position => {
  const clampedPoint = {
    x: clamp(point.x, 0, levelData.world.width),
    y: clamp(point.y, 0, levelData.world.height),
  };
  const candidates =
    endpoint === "start"
      ? [
          { x: 0, y: clampedPoint.y },
          { x: clampedPoint.x, y: levelData.world.height },
        ]
      : [
          { x: levelData.world.width, y: clampedPoint.y },
          { x: clampedPoint.x, y: levelData.world.height },
        ];

  return candidates.reduce((bestPoint, candidate) => {
    const bestDistance = Math.hypot(bestPoint.x - clampedPoint.x, bestPoint.y - clampedPoint.y);
    const candidateDistance = Math.hypot(candidate.x - clampedPoint.x, candidate.y - clampedPoint.y);
    return candidateDistance < bestDistance ? candidate : bestPoint;
  });
};

const getLineYAtX = (start: Position, end: Position, x: number) => {
  const span = end.x - start.x;
  if (Math.abs(span) < 1e-6) {
    return end.y;
  }
  const t = (x - start.x) / span;
  return lerp(start.y, end.y, t);
};

const inferEndpointFromInterior = (
  points: Position[],
  endpoint: "start" | "end",
  worldHeight: number,
) => {
  if (points.length < 3) {
    return points;
  }

  const nextPoints = points.map(clonePoint);
  if (endpoint === "start") {
    const targetX = nextPoints[0]!.x;
    nextPoints[0] = {
      x: targetX,
      y: clamp(getLineYAtX(nextPoints[1]!, nextPoints[2]!, targetX), 0, worldHeight),
    };
    return nextPoints;
  }

  const targetX = nextPoints.at(-1)!.x;
  nextPoints[nextPoints.length - 1] = {
    x: targetX,
    y: clamp(getLineYAtX(nextPoints.at(-3)!, nextPoints.at(-2)!, targetX), 0, worldHeight),
  };
  return nextPoints;
};

const inferStrokeEndpoints = (levelData: LevelData, points: Position[]) => {
  if (points.length < 3) {
    if (points.length === 0) {
      return [];
    }

    return points.map((point, index) =>
      index === 0
        ? projectEndpointToWorldBoundary(levelData, point, "start")
        : index === points.length - 1
          ? projectEndpointToWorldBoundary(levelData, point, "end")
          : clonePoint(point),
    );
  }

  const inferredPoints = inferEndpointFromInterior(
    inferEndpointFromInterior(points, "start", levelData.world.height),
    "end",
    levelData.world.height,
  );
  return inferredPoints.map((point, index) =>
    index === 0
      ? projectEndpointToWorldBoundary(levelData, point, "start")
      : index === inferredPoints.length - 1
        ? projectEndpointToWorldBoundary(levelData, point, "end")
        : clonePoint(point),
  );
};

const getGroundMinPointCount = (ground: LevelGround) => (ground.type === "line" ? 2 : 3);

const buildGroundFromPoints = (ground: LevelGround, points: Position[]): LevelGround =>
  ground.type === "line"
    ? { type: "line", points }
    : { type: "bezier", controlPoints: points };

const buildSegmentGroundFromPoints = (ground: LevelGround, points: Position[]): LevelGround | null => {
  if (ground.type === "line") {
    return points.length >= 2 ? { type: "line", points } : null;
  }

  if (points.length >= 3) {
    return { type: "bezier", controlPoints: points };
  }

  return points.length >= 2
    ? {
        type: "line",
        points,
      }
    : null;
};

const cloneGroundPoints = (ground: LevelGround) => getGroundEditorPoints(ground).map(clonePoint);

const isBoundaryBreakpointPoint = (levelData: Pick<LevelData, "world">, point: Position) =>
  point.y <= boundaryBreakpointEpsilon
  || point.y >= levelData.world.height - boundaryBreakpointEpsilon;

export const isBoundaryBreakpointIndex = (
  levelData: Pick<LevelData, "world">,
  ground: LevelGround | null | undefined,
  pointIndex: number,
) => {
  if (!ground) {
    return false;
  }

  const points = getBoundaryEditorPoints(ground);
  if (pointIndex <= 0 || pointIndex >= points.length - 1) {
    return false;
  }

  const point = points[pointIndex];
  return point ? isBoundaryBreakpointPoint(levelData, point) : false;
};

const normalizeGroundStrokeSimplifyConfig = (
  config?: Partial<GroundStrokeSimplifyConfig>,
): GroundStrokeSimplifyConfig => ({
  minSpan: Math.max(1, config?.minSpan ?? DEFAULT_GROUND_STROKE_SIMPLIFY_CONFIG.minSpan),
  angleWeight: Math.max(0, config?.angleWeight ?? DEFAULT_GROUND_STROKE_SIMPLIFY_CONFIG.angleWeight),
  stopEpsilon: Math.max(0, config?.stopEpsilon ?? DEFAULT_GROUND_STROKE_SIMPLIFY_CONFIG.stopEpsilon),
});

const getPointLineDistance = (point: Position, start: Position, end: Position) => {
  const deltaX = end.x - start.x;
  const deltaY = end.y - start.y;
  const length = Math.hypot(deltaX, deltaY);
  if (length < 1e-6) {
    return Math.hypot(point.x - start.x, point.y - start.y);
  }

  return Math.abs(deltaY * point.x - deltaX * point.y + end.x * start.y - end.y * start.x) / length;
};

const getTurningAngle = (points: Position[], index: number) => {
  if (index <= 0 || index >= points.length - 1) {
    return 0;
  }

  const previousPoint = points[index - 1]!;
  const currentPoint = points[index]!;
  const nextPoint = points[index + 1]!;
  const leftVector = {
    x: currentPoint.x - previousPoint.x,
    y: currentPoint.y - previousPoint.y,
  };
  const rightVector = {
    x: nextPoint.x - currentPoint.x,
    y: nextPoint.y - currentPoint.y,
  };
  const leftLength = Math.hypot(leftVector.x, leftVector.y);
  const rightLength = Math.hypot(rightVector.x, rightVector.y);
  if (leftLength < 1e-6 || rightLength < 1e-6) {
    return 0;
  }

  const cosine = clamp(
    ((leftVector.x * rightVector.x) + (leftVector.y * rightVector.y)) / (leftLength * rightLength),
    -1,
    1,
  );
  return Math.acos(cosine);
};

const getAdaptiveCandidateScore = (
  points: Position[],
  leftIndex: number,
  rightIndex: number,
  candidateIndex: number,
  config: GroundStrokeSimplifyConfig,
) => {
  const leftPoint = points[leftIndex]!;
  const rightPoint = points[rightIndex]!;
  const candidatePoint = points[candidateIndex]!;
  const deviation = getPointLineDistance(candidatePoint, leftPoint, rightPoint);
  const turningAngle = getTurningAngle(points, candidateIndex);
  const localSpan = Math.max(rightPoint.x - leftPoint.x, config.minSpan);
  const normalizedAngle = (turningAngle / Math.PI) * (localSpan / config.minSpan);
  return deviation * (1 + (normalizedAngle * config.angleWeight));
};

const selectAdaptiveSparsePoints = (
  points: Position[],
  maxCount: number,
  config: GroundStrokeSimplifyConfig,
) => {
  if (points.length <= maxCount) {
    return points;
  }

  const selectedIndices = new Set<number>([0, points.length - 1]);

  while (selectedIndices.size < maxCount) {
    const sortedIndices = [...selectedIndices].sort((left, right) => left - right);
    let bestCandidateIndex = -1;
    let bestCandidateScore = -1;

    for (let rangeIndex = 1; rangeIndex < sortedIndices.length; rangeIndex += 1) {
      const leftIndex = sortedIndices[rangeIndex - 1]!;
      const rightIndex = sortedIndices[rangeIndex]!;
      if (rightIndex - leftIndex <= 1) {
        continue;
      }

      let segmentBestIndex = -1;
      let segmentBestScore = -1;
      for (let candidateIndex = leftIndex + 1; candidateIndex < rightIndex; candidateIndex += 1) {
        const score = getAdaptiveCandidateScore(points, leftIndex, rightIndex, candidateIndex, config);
        if (score > segmentBestScore) {
          segmentBestScore = score;
          segmentBestIndex = candidateIndex;
        }
      }

      if (segmentBestScore > bestCandidateScore) {
        bestCandidateScore = segmentBestScore;
        bestCandidateIndex = segmentBestIndex;
      }
    }

    if (bestCandidateIndex < 0 || bestCandidateScore <= config.stopEpsilon) {
      break;
    }

    selectedIndices.add(bestCandidateIndex);
  }

  return [...selectedIndices]
    .sort((left, right) => left - right)
    .map((index) => points[index]!)
    .map(clonePoint);
};

const normalizeDrawnPoints = (
  levelData: LevelData,
  points: Position[],
  config?: Partial<GroundStrokeSimplifyConfig>,
) => {
  if (points.length === 0) {
    return [];
  }

  const simplifyConfig = normalizeGroundStrokeSimplifyConfig(config);

  const directionNormalizedPoints = points[0]!.x > points.at(-1)!.x
    ? [...points].reverse()
    : [...points];

  const mappedPoints = directionNormalizedPoints.map((point) => ({
    x: clamp(point.x, 0, levelData.world.width),
    y: clamp(point.y, 0, levelData.world.height),
  }));

  const filteredPoints = mappedPoints.reduce<Position[]>((result, point, index) => {
    if (index === 0) {
      result.push(point);
      return result;
    }

    const previousPoint = result.at(-1)!;
    if (point.x - previousPoint.x < MIN_CONTROL_POINT_GAP && index !== mappedPoints.length - 1) {
      return result;
    }

    result.push(point);
    return result;
  }, []);

  if (filteredPoints.length <= MAX_DRAWN_GROUND_POINTS) {
    return inferStrokeEndpoints(levelData, filteredPoints);
  }

  return inferStrokeEndpoints(
    levelData,
    selectAdaptiveSparsePoints(filteredPoints, MAX_DRAWN_GROUND_POINTS, simplifyConfig),
  );
};

const computeMonotoneSlopes = (points: Position[]) => {
  if (points.length <= 1) {
    return points.map(() => 0);
  }

  const deltas = points.slice(1).map((point, index) => {
    const previousPoint = points[index]!;
    const deltaX = point.x - previousPoint.x;
    return deltaX === 0 ? 0 : (point.y - previousPoint.y) / deltaX;
  });

  const slopes = points.map((_, index) => {
    if (index === 0) {
      return deltas[0] ?? 0;
    }
    if (index === points.length - 1) {
      return deltas.at(-1) ?? 0;
    }

    const leftDelta = deltas[index - 1] ?? 0;
    const rightDelta = deltas[index] ?? 0;
    if (leftDelta === 0 || rightDelta === 0 || leftDelta * rightDelta < 0) {
      return 0;
    }

    const leftSpan = points[index]!.x - points[index - 1]!.x;
    const rightSpan = points[index + 1]!.x - points[index]!.x;
    const leftWeight = 2 * rightSpan + leftSpan;
    const rightWeight = rightSpan + 2 * leftSpan;
    return (leftWeight + rightWeight) / ((leftWeight / leftDelta) + (rightWeight / rightDelta));
  });

  return slopes;
};

const interpolateMonotoneSegment = (
  startPoint: Position,
  endPoint: Position,
  startSlope: number,
  endSlope: number,
  t: number,
): Position => {
  const t2 = t * t;
  const t3 = t2 * t;
  const deltaX = endPoint.x - startPoint.x;

  return {
    x: lerp(startPoint.x, endPoint.x, t),
    y:
      (2 * t3 - 3 * t2 + 1) * startPoint.y
      + (t3 - 2 * t2 + t) * deltaX * startSlope
      + (-2 * t3 + 3 * t2) * endPoint.y
      + (t3 - t2) * deltaX * endSlope,
  };
};

const getControlPolylineLength = (points: Position[]) =>
  points.slice(1).reduce((total, point, index) => {
    const previousPoint = points[index]!;
    return total + Math.hypot(point.x - previousPoint.x, point.y - previousPoint.y);
  }, 0);

const getBoundaryPath = (points: Position[]) =>
  points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");

const buildSegmentPairs = (points: Position[]) =>
  points.slice(1).map((point, index) => [points[index]!, point] as [Position, Position]);

const createVoidSpanId = () => `void-${Math.random().toString(36).slice(2, 10)}`;

const getWorldPerimeterLength = (levelData: Pick<LevelData, "world">) =>
  (levelData.world.width * 2) + (levelData.world.height * 2);

const getPerimeterCoordinate = (levelData: Pick<LevelData, "world">, point: Position) => {
  const { width, height } = levelData.world;
  if (isCloseTo(point.y, 0)) {
    return clamp(point.x, 0, width);
  }
  if (isCloseTo(point.x, width)) {
    return width + clamp(point.y, 0, height);
  }
  if (isCloseTo(point.y, height)) {
    return width + height + (width - clamp(point.x, 0, width));
  }
  return (width * 2) + height + (height - clamp(point.y, 0, height));
};

const getPerimeterPointAt = (levelData: Pick<LevelData, "world">, coordinate: number): Position => {
  const { width, height } = levelData.world;
  const perimeter = getWorldPerimeterLength(levelData);
  const normalized = ((coordinate % perimeter) + perimeter) % perimeter;

  if (normalized <= width) {
    return { x: normalized, y: 0 };
  }
  if (normalized <= width + height) {
    return { x: width, y: normalized - width };
  }
  if (normalized <= (width * 2) + height) {
    return {
      x: width - (normalized - width - height),
      y: height,
    };
  }
  return {
    x: 0,
    y: height - (normalized - (width * 2) - height),
  };
};

const isPerimeterCoordinateWithinArc = (
  start: number,
  end: number,
  target: number,
  perimeter: number,
) => {
  const span = (end - start + perimeter) % perimeter;
  const offset = (target - start + perimeter) % perimeter;
  return offset > 0 && offset < span;
};

const getPerimeterCorners = (levelData: Pick<LevelData, "world">) => {
  const { width, height } = levelData.world;
  return [0, width, width + height, (width * 2) + height];
};

const buildPerimeterPath = (
  levelData: Pick<LevelData, "world">,
  start: Position,
  end: Position,
  anchorCoordinate: number,
): Position[] => {
  const perimeter = getWorldPerimeterLength(levelData);
  const startCoordinate = getPerimeterCoordinate(levelData, start);
  const endCoordinate = getPerimeterCoordinate(levelData, end);
  const useClockwise = isPerimeterCoordinateWithinArc(startCoordinate, endCoordinate, anchorCoordinate, perimeter);
  const corners = getPerimeterCorners(levelData);
  const traversedCorners = useClockwise ? corners : [...corners].reverse();
  const arcStart = useClockwise ? startCoordinate : endCoordinate;
  const arcEnd = useClockwise ? endCoordinate : startCoordinate;

  const points = traversedCorners
    .filter((corner) => isPerimeterCoordinateWithinArc(arcStart, arcEnd, corner, perimeter))
    .map((corner) => getPerimeterPointAt(levelData, corner));

  return [...points, clonePoint(end)];
};

export const createDefaultLineGround = (levelData: Pick<LevelData, "world">): LevelGround => {
  const baseY = levelData.world.height - DEFAULT_GROUND_OFFSET;
  return {
    type: "line",
    points: [
      { x: 0, y: baseY },
      { x: levelData.world.width / 2, y: baseY },
      { x: levelData.world.width, y: baseY },
    ],
  };
};

export const createDefaultBezierGround = (levelData: Pick<LevelData, "world">): LevelGround => {
  const baseY = levelData.world.height - DEFAULT_GROUND_OFFSET;
  return {
    type: "bezier",
    controlPoints: [
      { x: 0, y: baseY },
      { x: levelData.world.width * 0.25, y: baseY },
      { x: levelData.world.width * 0.5, y: baseY },
      { x: levelData.world.width * 0.75, y: baseY },
      { x: levelData.world.width, y: baseY },
    ],
  };
};

export const createDefaultCeilingBoundary = (levelData: Pick<LevelData, "world">): LevelGround => {
  const baseY = DEFAULT_GROUND_OFFSET;
  return {
    type: "line",
    points: [
      { x: 0, y: Math.min(levelData.world.height, baseY * 2) },
      { x: levelData.world.width * 0.5, y: baseY },
      { x: levelData.world.width, y: Math.min(levelData.world.height, baseY * 2) },
    ],
  };
};

export const getGroundEditorPoints = (ground: LevelGround) =>
  ground.type === "line" ? ground.points : ground.controlPoints;

export const getBoundaryEditorPoints = getGroundEditorPoints;

export const sampleGroundPath = (
  ground: LevelGround,
  sampleCount?: number,
): GroundSamplePoint[] => {
  if (ground.type === "line") {
    return ground.points.map(clonePoint);
  }

  const controlPoints = ground.controlPoints;
  if (controlPoints.length <= 2) {
    return controlPoints.map(clonePoint);
  }

  const totalSampleCount = sampleCount
    ?? clamp(Math.round(getControlPolylineLength(controlPoints) / 18), 24, 120);
  const segmentCount = controlPoints.length - 1;
  const samplesPerSegment = Math.max(6, Math.ceil(totalSampleCount / segmentCount));
  const slopes = computeMonotoneSlopes(controlPoints);
  const sampledPoints: GroundSamplePoint[] = [clonePoint(controlPoints[0]!)];

  for (let segmentIndex = 0; segmentIndex < segmentCount; segmentIndex += 1) {
    const startPoint = controlPoints[segmentIndex]!;
    const endPoint = controlPoints[segmentIndex + 1]!;
    const startSlope = slopes[segmentIndex] ?? 0;
    const endSlope = slopes[segmentIndex + 1] ?? 0;

    for (let sampleIndex = 1; sampleIndex <= samplesPerSegment; sampleIndex += 1) {
      sampledPoints.push(
        interpolateMonotoneSegment(
          startPoint,
          endPoint,
          startSlope,
          endSlope,
          sampleIndex / samplesPerSegment,
        ),
      );
    }
  }

  return sampledPoints;
};

export const sampleBoundaryPath = sampleGroundPath;

export const getBoundaryGroundSegments = (
  levelData: Pick<LevelData, "world">,
  ground: LevelGround | null | undefined,
): LevelGround[] => {
  if (!ground) {
    return [];
  }

  const points = getBoundaryEditorPoints(ground).map(clonePoint);
  if (points.length < 2) {
    return [];
  }

  const delimiterIndices = [
    0,
    ...points
      .slice(1, -1)
      .flatMap((point, index) => (isBoundaryBreakpointPoint(levelData, point) ? [index + 1] : [])),
    points.length - 1,
  ];

  const segments: LevelGround[] = [];
  for (let delimiterIndex = 0; delimiterIndex < delimiterIndices.length - 1; delimiterIndex += 2) {
    const startIndex = delimiterIndices[delimiterIndex]!;
    const endIndex = delimiterIndices[delimiterIndex + 1]!;
    const slice = points.slice(startIndex, endIndex + 1);
    const segment = buildSegmentGroundFromPoints(ground, slice);
    if (segment) {
      segments.push(segment);
    }
  }

  return segments;
};

export const sampleBoundaryPathSegments = (
  levelData: Pick<LevelData, "world">,
  ground: LevelGround | null | undefined,
): Position[][] => getBoundaryGroundSegments(levelData, ground).map((segment) => sampleBoundaryPath(segment));

export const createGroundBoundaryFromCeiling = (
  levelData: Pick<LevelData, "world">,
  ceilingBoundary: LevelGround,
  gap: number,
): LevelGround => ({
  type: "line",
  points: sampleBoundaryPath(ceilingBoundary).map((point) => ({
    x: point.x,
    y: clamp(point.y + gap, 0, levelData.world.height),
  })),
});

export const createBottomBoundaryFromTop = createGroundBoundaryFromCeiling;

export const createDefaultTerrain = (
  levelData: Pick<LevelData, "world"> & Partial<Pick<LevelData, "ground" | "terrain">>,
): LevelTerrain => {
  if (levelData.terrain) {
    return {
      ...(levelData.terrain.ceilingBoundary ? { ceilingBoundary: levelData.terrain.ceilingBoundary } : {}),
      groundBoundary: levelData.terrain.groundBoundary,
      voidSpans: levelData.terrain.voidSpans.map((span: TerrainVoidSpan) => ({ ...span })),
    };
  }

  const groundBoundary = levelData.ground ?? createDefaultLineGround(levelData);
  return {
    groundBoundary,
    voidSpans: [],
  };
};

export const getLevelTerrain = (levelData: LevelData): LevelTerrain => createDefaultTerrain(levelData);

export const getTerrainBoundary = (
  levelData: LevelData,
  boundary: TerrainBoundaryKind,
): LevelGround | null => (boundary === "ceiling" ? getLevelTerrain(levelData).ceilingBoundary ?? null : getLevelTerrain(levelData).groundBoundary);

const setLevelTerrain = (levelData: LevelData, terrain: LevelTerrain): LevelData => ({
  ...levelData,
  ground: terrain.groundBoundary,
  terrain,
});

export const ensureTerrainCeilingBoundary = (levelData: LevelData): LevelData => {
  const terrain = getLevelTerrain(levelData);
  if (terrain.ceilingBoundary) {
    return levelData;
  }

  return setLevelTerrain(levelData, {
    ...terrain,
    ceilingBoundary: createDefaultCeilingBoundary(levelData),
  });
};

export const clearTerrainCeilingBoundary = (levelData: LevelData): LevelData => {
  const terrain = getLevelTerrain(levelData);
  if (!terrain.ceilingBoundary) {
    return levelData;
  }

  return setLevelTerrain(levelData, {
    groundBoundary: terrain.groundBoundary,
    voidSpans: terrain.voidSpans,
  });
};

export const updateTerrainBoundary = (
  levelData: LevelData,
  boundary: TerrainBoundaryKind,
  nextBoundary: LevelGround,
): LevelData => {
  const terrain = getLevelTerrain(levelData);
  return setLevelTerrain(levelData, {
    ...terrain,
    ...(boundary === "ceiling" ? { ceilingBoundary: nextBoundary } : terrain.ceilingBoundary ? { ceilingBoundary: terrain.ceilingBoundary } : {}),
    groundBoundary: boundary === "ground" ? nextBoundary : terrain.groundBoundary,
  });
};

export const getLevelGround = (levelData: LevelData): LevelGround => getLevelTerrain(levelData).groundBoundary;

export const getGroundSurfaceYAtX = (points: GroundSamplePoint[], x: number) => {
  if (points.length === 0) {
    return 0;
  }

  if (x <= points[0]!.x) {
    return points[0]!.y;
  }

  for (let index = 1; index < points.length; index += 1) {
    const start = points[index - 1]!;
    const end = points[index]!;
    if (x <= end.x) {
      const span = end.x - start.x || 1;
      const t = (x - start.x) / span;
      return lerp(start.y, end.y, t);
    }
  }

  return points.at(-1)!.y;
};

const clampGroundPoint = (
  levelData: LevelData,
  _boundary: TerrainBoundaryKind,
  points: Position[],
  index: number,
  nextPoint: Position,
): Position => {
  const previousPoint = points[index - 1] ?? null;
  const followingPoint = points[index + 1] ?? null;
  const isFirst = index === 0;
  const isLast = index === points.length - 1;

  return {
    ...(isFirst
      ? projectEndpointToWorldBoundary(levelData, nextPoint, "start")
      : isLast
        ? projectEndpointToWorldBoundary(levelData, nextPoint, "end")
        : {
            x: clamp(
              nextPoint.x,
              (previousPoint?.x ?? 0) + MIN_CONTROL_POINT_GAP,
              (followingPoint?.x ?? levelData.world.width) - MIN_CONTROL_POINT_GAP,
            ),
            y: clamp(nextPoint.y, 0, levelData.world.height),
          }),
  };
};

const updateBoundaryPointInGround = (
  levelData: LevelData,
  boundary: TerrainBoundaryKind,
  ground: LevelGround | null,
  index: number,
  point: Position,
): LevelGround | null => {
  if (!ground) {
    return null;
  }

  const points = getBoundaryEditorPoints(ground);
  if (!points[index]) {
    return null;
  }

  const nextPoints = points.map((currentPoint, currentIndex) =>
    currentIndex === index
      ? clampGroundPoint(levelData, boundary, points, currentIndex, point)
      : clonePoint(currentPoint),
  );

  return buildGroundFromPoints(ground, nextPoints);
};

const replaceBoundaryFromStrokeInGround = (
  levelData: LevelData,
  ground: LevelGround | null,
  strokePoints: Position[],
  config?: Partial<GroundStrokeSimplifyConfig>,
): LevelGround | null => {
  const normalizedPoints = normalizeDrawnPoints(levelData, strokePoints, config);
  if (!ground) {
    return normalizedPoints.length >= 2
      ? {
          type: "line",
          points: normalizedPoints.map(clonePoint),
        }
      : null;
  }

  if (normalizedPoints.length < getGroundMinPointCount(ground)) {
    return null;
  }

  const minX = normalizedPoints[0]!.x;
  const maxX = normalizedPoints.at(-1)!.x;
  const currentPoints = cloneGroundPoints(ground);
  const leftPoints = currentPoints.filter((point) => point.x < minX);
  const rightPoints = currentPoints.filter((point) => point.x > maxX);
  const mergedPoints = [...leftPoints, ...normalizedPoints, ...rightPoints];
  if (mergedPoints.length < getGroundMinPointCount(ground)) {
    return null;
  }

  return buildGroundFromPoints(ground, mergedPoints);
};

const insertBoundaryPointInGround = (
  levelData: LevelData,
  ground: LevelGround | null,
  anchorIndex: number,
  direction: "before" | "after",
): { ground: LevelGround; pointIndex: number } | null => {
  if (!ground) {
    return null;
  }

  const points = cloneGroundPoints(ground);
  const anchorPoint = points[anchorIndex];
  if (!anchorPoint) {
    return null;
  }

  const insertionIndex = direction === "before" ? anchorIndex : anchorIndex + 1;
  const previousPoint = points[insertionIndex - 1] ?? null;
  const nextPoint = points[insertionIndex] ?? null;
  const fallbackOffset = Math.max(levelData.world.width * 0.08, 48);
  const insertedPoint = clampGroundPoint(
    levelData,
    "ground",
    points,
    insertionIndex,
    previousPoint && nextPoint
      ? {
          x: (previousPoint.x + nextPoint.x) / 2,
          y: (previousPoint.y + nextPoint.y) / 2,
        }
      : previousPoint
        ? {
            x: Math.min(levelData.world.width, previousPoint.x + fallbackOffset),
            y: previousPoint.y,
          }
        : nextPoint
          ? {
              x: Math.max(0, nextPoint.x - fallbackOffset),
              y: nextPoint.y,
            }
          : {
              x: levelData.world.width / 2,
              y: levelData.world.height - DEFAULT_GROUND_OFFSET,
            },
  );

  points.splice(insertionIndex, 0, insertedPoint);
  return {
    ground: buildGroundFromPoints(ground, points),
    pointIndex: insertionIndex,
  };
};

const removeBoundaryPointInGround = (
  ground: LevelGround | null,
  pointIndex: number,
): { ground: LevelGround; nextSelectedPointIndex: number | null } | null => {
  if (!ground) {
    return null;
  }

  const points = cloneGroundPoints(ground);
  if (!points[pointIndex] || points.length <= getGroundMinPointCount(ground)) {
    return { ground, nextSelectedPointIndex: pointIndex < points.length ? pointIndex : null };
  }

  points.splice(pointIndex, 1);
  return {
    ground: buildGroundFromPoints(ground, points),
    nextSelectedPointIndex: points.length === 0 ? null : Math.min(pointIndex, points.length - 1),
  };
};

const reorderBoundaryPointInGround = (
  ground: LevelGround | null,
  pointIndex: number,
  direction: "left" | "right",
): { ground: LevelGround; pointIndex: number } | null => {
  if (!ground) {
    return null;
  }

  const points = cloneGroundPoints(ground);
  const swapIndex = direction === "left" ? pointIndex - 1 : pointIndex + 1;
  if (
    pointIndex <= 0
    || pointIndex >= points.length - 1
    || swapIndex <= 0
    || swapIndex >= points.length - 1
  ) {
    return { ground, pointIndex };
  }

  const currentPoint = points[pointIndex]!;
  points[pointIndex] = points[swapIndex]!;
  points[swapIndex] = currentPoint;
  return {
    ground: buildGroundFromPoints(ground, points),
    pointIndex: swapIndex,
  };
};

export const updateGroundPoint = (
  levelData: LevelData,
  index: number,
  point: Position,
): LevelData => {
  return updateTerrainBoundaryPoint(levelData, "ground", index, point);
};

export const updateTerrainBoundaryPoint = (
  levelData: LevelData,
  boundary: TerrainBoundaryKind,
  index: number,
  point: Position,
): LevelData => {
  const nextBoundary = updateBoundaryPointInGround(levelData, boundary, getTerrainBoundary(levelData, boundary), index, point);
  if (!nextBoundary) {
    return levelData;
  }
  return updateTerrainBoundary(levelData, boundary, nextBoundary);
};

export const createGroundFromStroke = (
  levelData: LevelData,
  strokePoints: Position[],
  config?: Partial<GroundStrokeSimplifyConfig>,
): LevelData => {
  return createTerrainBoundaryFromStroke(levelData, "ground", strokePoints, config);
};

export const createTerrainBoundaryFromStroke = (
  levelData: LevelData,
  boundary: TerrainBoundaryKind,
  strokePoints: Position[],
  config?: Partial<GroundStrokeSimplifyConfig>,
): LevelData => {
  const nextBoundary = replaceBoundaryFromStrokeInGround(
    levelData,
    getTerrainBoundary(levelData, boundary),
    strokePoints,
    config,
  );
  return nextBoundary ? updateTerrainBoundary(levelData, boundary, nextBoundary) : levelData;
};

export const insertGroundPoint = (
  levelData: LevelData,
  anchorIndex: number,
  direction: "before" | "after",
): { levelData: LevelData; pointIndex: number } => {
  return insertTerrainBoundaryPoint(levelData, "ground", anchorIndex, direction);
};

export const insertTerrainBoundaryPoint = (
  levelData: LevelData,
  boundary: TerrainBoundaryKind,
  anchorIndex: number,
  direction: "before" | "after",
): { levelData: LevelData; pointIndex: number } => {
  const next = insertBoundaryPointInGround(levelData, getTerrainBoundary(levelData, boundary), anchorIndex, direction);
  if (!next) {
    return { levelData, pointIndex: -1 };
  }
  return { levelData: updateTerrainBoundary(levelData, boundary, next.ground), pointIndex: next.pointIndex };
};

export const removeGroundPoint = (
  levelData: LevelData,
  pointIndex: number,
): { levelData: LevelData; nextSelectedPointIndex: number | null } => {
  return removeTerrainBoundaryPoint(levelData, "ground", pointIndex);
};

export const removeTerrainBoundaryPoint = (
  levelData: LevelData,
  boundary: TerrainBoundaryKind,
  pointIndex: number,
): { levelData: LevelData; nextSelectedPointIndex: number | null } => {
  const next = removeBoundaryPointInGround(getTerrainBoundary(levelData, boundary), pointIndex);
  if (!next) {
    return { levelData, nextSelectedPointIndex: null };
  }
  return {
    levelData: updateTerrainBoundary(levelData, boundary, next.ground),
    nextSelectedPointIndex: next.nextSelectedPointIndex,
  };
};

export const reorderGroundPoint = (
  levelData: LevelData,
  pointIndex: number,
  direction: "left" | "right",
): { levelData: LevelData; pointIndex: number } => {
  return reorderTerrainBoundaryPoint(levelData, "ground", pointIndex, direction);
};

export const reorderTerrainBoundaryPoint = (
  levelData: LevelData,
  boundary: TerrainBoundaryKind,
  pointIndex: number,
  direction: "left" | "right",
): { levelData: LevelData; pointIndex: number } => {
  const next = reorderBoundaryPointInGround(getTerrainBoundary(levelData, boundary), pointIndex, direction);
  if (!next) {
    return { levelData, pointIndex };
  }
  return { levelData: updateTerrainBoundary(levelData, boundary, next.ground), pointIndex: next.pointIndex };
};

export const setGroundType = (
  levelData: LevelData,
  type: LevelGround["type"],
): LevelData => {
  return setTerrainBoundaryType(levelData, "ground", type);
};

export const setTerrainBoundaryType = (
  levelData: LevelData,
  boundary: TerrainBoundaryKind,
  type: LevelGround["type"],
): LevelData => {
  const currentGround = getTerrainBoundary(levelData, boundary);
  if (!currentGround) {
    return levelData;
  }
  if (currentGround.type === type) {
    return updateTerrainBoundary(levelData, boundary, currentGround);
  }

  const sampled = sampleGroundPath(currentGround, 4);
  if (type === "line") {
    return updateTerrainBoundary(levelData, boundary, {
      type: "line",
      points: sampled.map(clonePoint),
    });
  }

  const fallbackBezierGround = createDefaultBezierGround(levelData);
  const controlPoints = sampled.length >= 5
    ? sampled
    : fallbackBezierGround.type === "bezier"
      ? fallbackBezierGround.controlPoints
      : sampled;
  return updateTerrainBoundary(levelData, boundary, {
    type: "bezier",
    controlPoints: controlPoints.map(clonePoint),
  });
};

const clipSampledPathToInterval = (points: Position[], startX: number, endX: number) => {
  if (points.length === 0 || endX <= startX) {
    return [];
  }

  const clipped = points.filter((point) => point.x > startX && point.x < endX).map(clonePoint);
  const startY = getGroundSurfaceYAtX(points, startX);
  const endY = getGroundSurfaceYAtX(points, endX);
  return [
    { x: startX, y: startY },
    ...clipped,
    { x: endX, y: endY },
  ];
};

const getSolidIntervals = (levelData: Pick<LevelData, "world">, terrain: LevelTerrain) => {
  const mergedSpans = [...terrain.voidSpans]
    .sort((left, right) => left.startX - right.startX)
    .reduce<TerrainVoidSpan[]>((result, span) => {
      const previous = result.at(-1);
      if (!previous || span.startX > previous.endX) {
        result.push({ ...span });
        return result;
      }

      previous.endX = Math.max(previous.endX, span.endX);
      return result;
    }, []);

  return sampleBoundaryPathSegments(levelData, terrain.groundBoundary).flatMap((groundPoints) => {
    const minX = groundPoints[0]?.x ?? 0;
    const maxX = groundPoints.at(-1)?.x ?? 0;
    let cursor = minX;
    const intervals: Array<{ startX: number; endX: number }> = [];

    for (const span of mergedSpans) {
      const startX = clamp(span.startX, minX, maxX);
      const endX = clamp(span.endX, minX, maxX);
      if (startX > cursor) {
        intervals.push({ startX: cursor, endX: startX });
      }
      cursor = Math.max(cursor, endX);
    }

    if (cursor < maxX) {
      intervals.push({ startX: cursor, endX: maxX });
    }

    return intervals.filter((interval) => interval.endX - interval.startX >= MIN_CONTROL_POINT_GAP);
  });
};

export const createTerrainVoidSpanFromStroke = (
  levelData: LevelData,
  strokePoints: Position[],
): TerrainVoidSpan | null => {
  if (strokePoints.length < 2) {
    return null;
  }

  const xs = strokePoints.map((point) => clamp(point.x, 0, levelData.world.width));
  const startX = Math.min(...xs);
  const endX = Math.max(...xs);
  if (endX - startX < MIN_CONTROL_POINT_GAP) {
    return null;
  }

  return {
    id: createVoidSpanId(),
    startX,
    endX,
  };
};

export const addTerrainVoidSpan = (levelData: LevelData, span: TerrainVoidSpan): LevelData => {
  const terrain = getLevelTerrain(levelData);
  return setLevelTerrain(levelData, {
    ...terrain,
    voidSpans: [...terrain.voidSpans, span],
  });
};

export const removeTerrainVoidSpan = (levelData: LevelData, spanId: string): LevelData => {
  const terrain = getLevelTerrain(levelData);
  return setLevelTerrain(levelData, {
    ...terrain,
    voidSpans: terrain.voidSpans.filter((span) => span.id !== spanId),
  });
};

export const sampleCeilingPolygon = (
  levelData: Pick<LevelData, "world">,
  ceilingBoundary: LevelGround | null | undefined,
): Position[][] => sampleBoundaryPathSegments(levelData, ceilingBoundary)
  .map((ceilingPoints) => {
    const startPoint = ceilingPoints[0];
    const endPoint = ceilingPoints.at(-1);
    if (!startPoint || !endPoint) {
      return null;
    }

    const closurePoints = buildPerimeterPath(
      levelData,
      endPoint,
      startPoint,
      levelData.world.width / 2,
    );
    const polygon = [...ceilingPoints, ...closurePoints];
    return polygon.length >= 3 ? polygon : null;
  })
  .filter((polygon): polygon is Position[] => polygon !== null);

export const sampleTerrainPolygon = (
  levelData: Pick<LevelData, "world">,
  terrain: LevelTerrain,
): TerrainPolygonSample => {
  const groundSegments = sampleBoundaryPathSegments(levelData, terrain.groundBoundary);
  const allGroundPoints = groundSegments.flat();
  const fillBottomY = Math.max(...allGroundPoints.map((point) => point.y), 0) + DEFAULT_GROUND_OFFSET * 4;
  const mergedSpans = [...terrain.voidSpans]
    .sort((left, right) => left.startX - right.startX)
    .reduce<TerrainVoidSpan[]>((result, span) => {
      const previous = result.at(-1);
      if (!previous || span.startX > previous.endX) {
        result.push({ ...span });
        return result;
      }

      previous.endX = Math.max(previous.endX, span.endX);
      return result;
    }, []);

  const groundPolygons = groundSegments.flatMap((segment) => {
    const minX = segment[0]?.x ?? 0;
    const maxX = segment.at(-1)?.x ?? 0;
    let cursor = minX;
    const polygons: Position[][] = [];

    for (const span of mergedSpans) {
      const startX = clamp(span.startX, minX, maxX);
      const endX = clamp(span.endX, minX, maxX);
      if (startX > cursor) {
        const groundSlice = clipSampledPathToInterval(segment, cursor, startX);
        if (groundSlice.length >= 2) {
          polygons.push([
            ...groundSlice,
            { x: startX, y: fillBottomY },
            { x: cursor, y: fillBottomY },
          ]);
        }
      }
      cursor = Math.max(cursor, endX);
    }

    if (cursor < maxX) {
      const groundSlice = clipSampledPathToInterval(segment, cursor, maxX);
      if (groundSlice.length >= 2) {
        polygons.push([
          ...groundSlice,
          { x: maxX, y: fillBottomY },
          { x: cursor, y: fillBottomY },
        ]);
      }
    }

    return polygons.filter((polygon) => polygon.length >= 4);
  });

  const ceilingPolygons = sampleCeilingPolygon(levelData, terrain.ceilingBoundary);

  return { polygons: [...groundPolygons, ...ceilingPolygons] };
};

export const getTerrainPathData = (levelData: Pick<LevelData, "world">, terrain: LevelTerrain) => sampleTerrainPolygon(levelData, terrain)
  .polygons
  .map((polygon) => `${getBoundaryPath(polygon)} Z`)
  .join(" ");

export const sampleTerrainCollisionSegments = (terrain: LevelTerrain): TerrainCollisionSample => ({
  topSegments: [],
  bottomSegments: buildSegmentPairs(sampleBoundaryPath(terrain.groundBoundary)),
  voidSegments: terrain.voidSpans.flatMap((span) => {
    const groundPoints = sampleBoundaryPath(terrain.groundBoundary);
    const voidFloorY = Math.max(...groundPoints.map((point) => point.y), 0) + DEFAULT_GROUND_OFFSET * 4;
    const startTop = { x: span.startX, y: getGroundSurfaceYAtX(groundPoints, span.startX) };
    const startBottom = { x: span.startX, y: voidFloorY };
    const endTop = { x: span.endX, y: getGroundSurfaceYAtX(groundPoints, span.endX) };
    const endBottom = { x: span.endX, y: voidFloorY };
    return [
      [startTop, startBottom] as [Position, Position],
      [endTop, endBottom] as [Position, Position],
    ];
  }),
});
