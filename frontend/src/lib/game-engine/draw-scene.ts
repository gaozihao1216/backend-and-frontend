import type { GameBody, GameSnapshot } from "./types.js";
import type { StatusEffectInstance } from "./skills/status-effects.js";
import { getGroundSurfaceYAtX } from "../ground.js";

const GROUND_STRIPE_WIDTH = 8;
const GROUND_STRIPE_HEIGHT = 8;
const GROUND_SLOPE_SAMPLE_RADIUS = 12;
export type GroundMaterialRenderConfig = {
  cliffStart: number;
  cliffEnd: number;
  noGrassSlope: number;
  cliffRockBoost: number;
  cliffGrassPenalty: number;
  noiseScale: number;
  noiseStrength: number;
  a1: number;
  a2: number;
  alphaBase: number;
  alphaJitter: number;
  sigmoidA: number;
  sigmoidBeta: number;
  sigmoidGamma: number;
  grassCurveSampleStep: number;
  grassCurveSmoothingPasses: number;
};

const DEFAULT_GROUND_MATERIAL_RENDER_CONFIG: GroundMaterialRenderConfig = {
  cliffStart: 0.2,
  cliffEnd: 0.9,
  noGrassSlope: 0.62,
  cliffRockBoost: 0.92,
  cliffGrassPenalty: 1,
  noiseScale: 0.035,
  noiseStrength: 0.08,
  a1: 0.22,
  a2: 0.58,
  alphaBase: 1.18,
  alphaJitter: 0.35,
  sigmoidA: 1.2,
  sigmoidBeta: 7.5,
  sigmoidGamma: 0.45,
  grassCurveSampleStep: 16,
  grassCurveSmoothingPasses: 2,
};
let groundMaterialRenderConfig: GroundMaterialRenderConfig = { ...DEFAULT_GROUND_MATERIAL_RENDER_CONFIG };

export const getGroundMaterialRenderConfig = (): GroundMaterialRenderConfig => ({ ...groundMaterialRenderConfig });

export const setGroundMaterialRenderConfig = (nextConfig: Partial<GroundMaterialRenderConfig>) => {
  groundMaterialRenderConfig = {
    ...groundMaterialRenderConfig,
    ...nextConfig,
  };
};

export const resetGroundMaterialRenderConfig = () => {
  groundMaterialRenderConfig = { ...DEFAULT_GROUND_MATERIAL_RENDER_CONFIG };
};

export const getDefaultGroundMaterialRenderConfig = (): GroundMaterialRenderConfig => ({ ...DEFAULT_GROUND_MATERIAL_RENDER_CONFIG });
const GROUND_PALETTE = {
  grass: [122, 156, 76] as const,
  soil: [126, 88, 54] as const,
  rock: [112, 114, 118] as const,
};

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

const smoothstep = (edge0: number, edge1: number, value: number) => {
  const t = clamp01((value - edge0) / Math.max(1e-6, edge1 - edge0));
  return t * t * (3 - 2 * t);
};

const fract = (value: number) => value - Math.floor(value);

const hashNoise1D = (ix: number) =>
  fract(Math.sin(ix * 127.1) * 43758.5453123) * 2 - 1;

const valueNoise1D = (x: number, cellSize: number) => {
  const gx = x / cellSize;
  const x0 = Math.floor(gx);
  const x1 = x0 + 1;
  const tx = smoothstep(0, 1, gx - x0);
  const v0 = hashNoise1D(x0);
  const v1 = hashNoise1D(x1);
  return (v0 * (1 - tx)) + (v1 * tx);
};

const layeredTerrainNoise = (x: number) =>
  valueNoise1D(x, 72) * 0.74
  + valueNoise1D(x + 19.7, 28) * 0.26;

type GroundMaterialKind = "grass" | "soil" | "rock";

const getMaterialBaseColor = (materialKind: GroundMaterialKind) => {
  switch (materialKind) {
    case "grass":
      return GROUND_PALETTE.grass;
    case "rock":
      return GROUND_PALETTE.rock;
    case "soil":
    default:
      return GROUND_PALETTE.soil;
  }
};

const getMaterialColor = (
  materialKind: GroundMaterialKind,
  cliffFactor: number,
  noiseValue: number,
) => {
  const baseColor = getMaterialBaseColor(materialKind);
  const shade =
    1
    - cliffFactor * (materialKind === "rock" ? 0.18 : 0.1)
    + noiseValue * groundMaterialRenderConfig.noiseStrength;
  return `rgb(${Math.round(baseColor[0] * shade)}, ${Math.round(baseColor[1] * shade)}, ${Math.round(baseColor[2] * shade)})`;
};

const mixSurfaceEdgeColor = (
  slopeAbs: number,
  noiseValue: number,
) => {
  const grassEdge = [116, 148, 70] as const;
  const soilEdge = [110, 76, 46] as const;
  const rockEdge = [95, 97, 102] as const;
  const grassWeight = slopeAbs >= groundMaterialRenderConfig.noGrassSlope
    ? 0
    : 1 - smoothstep(groundMaterialRenderConfig.cliffStart, groundMaterialRenderConfig.noGrassSlope, slopeAbs);
  const rockWeight = smoothstep(
    groundMaterialRenderConfig.cliffStart * 0.9,
    groundMaterialRenderConfig.cliffEnd,
    slopeAbs,
  );
  const soilWeight = Math.max(0, 1 - grassWeight - rockWeight);
  const total = Math.max(1e-6, grassWeight + soilWeight + rockWeight);
  const normalizedGrass = grassWeight / total;
  const normalizedSoil = soilWeight / total;
  const normalizedRock = rockWeight / total;

  const r =
    grassEdge[0] * normalizedGrass
    + soilEdge[0] * normalizedSoil
    + rockEdge[0] * normalizedRock;
  const g =
    grassEdge[1] * normalizedGrass
    + soilEdge[1] * normalizedSoil
    + rockEdge[1] * normalizedRock;
  const b =
    grassEdge[2] * normalizedGrass
    + soilEdge[2] * normalizedSoil
    + rockEdge[2] * normalizedRock;
  const shade = 0.92 + noiseValue * 0.04 - rockWeight * 0.14;
  return `rgb(${Math.round(r * shade)}, ${Math.round(g * shade)}, ${Math.round(b * shade)})`;
};

const getSlopeAtX = (points: Array<{ x: number; y: number }>, x: number) => {
  const leftY = getGroundSurfaceYAtX(points, x - GROUND_SLOPE_SAMPLE_RADIUS);
  const rightY = getGroundSurfaceYAtX(points, x + GROUND_SLOPE_SAMPLE_RADIUS);
  return (rightY - leftY) / (GROUND_SLOPE_SAMPLE_RADIUS * 2);
};

const getSlopeSignal = (
  slopeAbs: number,
  config: GroundMaterialRenderConfig = groundMaterialRenderConfig,
) => config.sigmoidA - 1 / (1 + Math.exp(config.sigmoidBeta * (slopeAbs - config.sigmoidGamma)));

const evaluateGroundMaterialField = (
  depthRatio: number,
  slopeAbs: number,
  alphaLocal: number,
  config: GroundMaterialRenderConfig = groundMaterialRenderConfig,
) => {
  const cliffFactor = smoothstep(config.cliffStart, config.cliffEnd, slopeAbs);
  const slopeFactor =
    getSlopeSignal(slopeAbs, config)
    + cliffFactor * (config.cliffRockBoost * 0.35)
    + (slopeAbs >= config.noGrassSlope ? 0.18 : 0);
  const fieldValue = slopeFactor * Math.pow(clamp01(depthRatio), alphaLocal);
  const grassThreshold = slopeAbs >= config.noGrassSlope ? -1 : config.a1;
  const soilThreshold = config.a2;
  const materialKind: GroundMaterialKind =
    fieldValue < grassThreshold
      ? "grass"
      : fieldValue < soilThreshold
        ? "soil"
        : "rock";

  return {
    fieldValue,
    materialKind,
    cliffFactor,
  };
};

const getPerimeterCoordinate = (snapshot: GameSnapshot, point: { x: number; y: number }) => {
  if (Math.abs(point.y) <= 1e-6) {
    return point.x;
  }
  if (Math.abs(point.x - snapshot.width) <= 1e-6) {
    return snapshot.width + point.y;
  }
  if (Math.abs(point.y - snapshot.height) <= 1e-6) {
    return snapshot.width + snapshot.height + (snapshot.width - point.x);
  }
  return (snapshot.width * 2) + snapshot.height + (snapshot.height - point.y);
};

const getPerimeterPointAt = (snapshot: GameSnapshot, coordinate: number) => {
  const perimeter = (snapshot.width * 2) + (snapshot.height * 2);
  const normalized = ((coordinate % perimeter) + perimeter) % perimeter;

  if (normalized <= snapshot.width) {
    return { x: normalized, y: 0 };
  }
  if (normalized <= snapshot.width + snapshot.height) {
    return { x: snapshot.width, y: normalized - snapshot.width };
  }
  if (normalized <= (snapshot.width * 2) + snapshot.height) {
    return {
      x: snapshot.width - (normalized - snapshot.width - snapshot.height),
      y: snapshot.height,
    };
  }
  return {
    x: 0,
    y: snapshot.height - (normalized - (snapshot.width * 2) - snapshot.height),
  };
};

const isWithinArc = (start: number, end: number, target: number, perimeter: number) => {
  const span = (end - start + perimeter) % perimeter;
  const offset = (target - start + perimeter) % perimeter;
  return offset > 0 && offset < span;
};

const buildCeilingClosurePoints = (snapshot: GameSnapshot, endPoint: { x: number; y: number }, startPoint: { x: number; y: number }) => {
  const perimeter = (snapshot.width * 2) + (snapshot.height * 2);
  const endCoordinate = getPerimeterCoordinate(snapshot, endPoint);
  const startCoordinate = getPerimeterCoordinate(snapshot, startPoint);
  const anchorCoordinate = snapshot.width / 2;
  const corners = [0, snapshot.width, snapshot.width + snapshot.height, (snapshot.width * 2) + snapshot.height];
  const useClockwise = isWithinArc(endCoordinate, startCoordinate, anchorCoordinate, perimeter);
  const traversedCorners = useClockwise ? corners : [...corners].reverse();
  const arcStart = useClockwise ? endCoordinate : startCoordinate;
  const arcEnd = useClockwise ? startCoordinate : endCoordinate;

  return [
    ...traversedCorners
      .filter((corner) => isWithinArc(arcStart, arcEnd, corner, perimeter))
      .map((corner) => getPerimeterPointAt(snapshot, corner)),
    startPoint,
  ];
};

const getBlockFillStyle = (body: GameBody) => {
  const entity = body.plugin.gameEntity;
  if (entity?.kind !== "block") {
    return "#c48a4d";
  }

  switch (entity.material) {
    case "stone":
      return entity.state === "cracking" ? "#8a8f99" : "#9ea4ae";
    case "glass":
      return entity.state === "cracking" ? "rgba(146, 216, 224, 0.76)" : "rgba(176, 236, 242, 0.64)";
    case "wood":
    default:
      return entity.state === "cracking" ? "#b2743d" : "#c48a4d";
  }
};

const traceBodyPolygon = (ctx: CanvasRenderingContext2D, body: GameBody) => {
  const [firstVertex, ...restVertices] = body.vertices;
  if (!firstVertex) {
    return false;
  }

  ctx.beginPath();
  ctx.moveTo(firstVertex.x - body.position.x, firstVertex.y - body.position.y);
  for (const vertex of restVertices) {
    ctx.lineTo(vertex.x - body.position.x, vertex.y - body.position.y);
  }
  ctx.closePath();
  return true;
};

const traceRenderRectangle = (ctx: CanvasRenderingContext2D, body: GameBody) => {
  const width = body.renderWidth;
  const height = body.renderHeight;
  if (!width || !height) {
    return false;
  }

  ctx.beginPath();
  ctx.rect(-width / 2, -height / 2, width, height);
  ctx.closePath();
  return true;
};

const buildSmoothPathThroughPoints = (ctx: CanvasRenderingContext2D, points: Array<{ x: number; y: number }>) => {
  const [firstPoint, ...restPoints] = points;
  if (!firstPoint) {
    return;
  }

  ctx.moveTo(firstPoint.x, firstPoint.y);
  if (restPoints.length === 0) {
    return;
  }

  for (let index = 0; index < restPoints.length - 1; index += 1) {
    const currentPoint = restPoints[index]!;
    const nextPoint = restPoints[index + 1]!;
    const midPoint = {
      x: (currentPoint.x + nextPoint.x) * 0.5,
      y: (currentPoint.y + nextPoint.y) * 0.5,
    };
    ctx.quadraticCurveTo(currentPoint.x, currentPoint.y, midPoint.x, midPoint.y);
  }

  const lastPoint = restPoints.at(-1)!;
  ctx.lineTo(lastPoint.x, lastPoint.y);
};

const getCurveMidpoint = (points: Array<{ x: number; y: number }>) => {
  const [firstPoint] = points;
  const lastPoint = points.at(-1);
  if (!firstPoint || !lastPoint) {
    return null;
  }

  return {
    x: (firstPoint.x + lastPoint.x) * 0.5,
    y: (firstPoint.y + lastPoint.y) * 0.5,
  };
};

const smoothBoundaryPoints = (
  points: Array<{ x: number; y: number }>,
  passes: number,
) => {
  let smoothedPoints = points;
  for (let pass = 0; pass < passes; pass += 1) {
    smoothedPoints = smoothedPoints.map((point, index) => {
      if (index === 0 || index === smoothedPoints.length - 1) {
        return point;
      }

      const previousPoint = smoothedPoints[index - 1]!;
      const nextPoint = smoothedPoints[index + 1]!;
      return {
        x: point.x,
        y: (previousPoint.y + point.y * 2 + nextPoint.y) / 4,
      };
    });
  }

  return smoothedPoints;
};

const sampleMaterialBoundaryPoints = (
  groundPoints: Array<{ x: number; y: number }>,
  startX: number,
  endX: number,
  bottomY: number,
  threshold: number,
  allowThreshold: (slopeAbs: number) => boolean,
) => {
  const sampleStep = Math.max(
    GROUND_STRIPE_WIDTH * 2,
    groundMaterialRenderConfig.grassCurveSampleStep,
  );
  const sampledPoints: Array<{ x: number; y: number }> = [];

  for (let x = startX; x <= endX; x += sampleStep) {
    const surfaceY = getGroundSurfaceYAtX(groundPoints, x);
    const slopeAbs = Math.abs(getSlopeAtX(groundPoints, x));
    const maxDepth = Math.max(1, bottomY - surfaceY);
    let transitionY = surfaceY;

    if (allowThreshold(slopeAbs)) {
      let previousFieldValue = Number.NEGATIVE_INFINITY;
      let previousY = surfaceY;

      for (let y = surfaceY + GROUND_STRIPE_HEIGHT; y <= bottomY; y += GROUND_STRIPE_HEIGHT) {
        const depth = Math.max(0, y - surfaceY);
        const depthRatio = depth / maxDepth;
        const terrainNoise = layeredTerrainNoise(
          x * groundMaterialRenderConfig.noiseScale * 40,
        );
        const alphaLocal = groundMaterialRenderConfig.alphaBase + terrainNoise * groundMaterialRenderConfig.alphaJitter;
        const field = evaluateGroundMaterialField(depthRatio, slopeAbs, alphaLocal);

        if (field.fieldValue >= threshold) {
          const denominator = Math.max(1e-6, field.fieldValue - previousFieldValue);
          const t = previousFieldValue === Number.NEGATIVE_INFINITY
            ? 1
            : clamp01((threshold - previousFieldValue) / denominator);
          transitionY = previousY + (y - previousY) * t;
          break;
        }

        previousFieldValue = field.fieldValue;
        previousY = y;
        transitionY = y;
      }
    }

    sampledPoints.push({ x, y: transitionY });
  }

  if ((sampledPoints.at(-1)?.x ?? startX) < endX) {
    sampledPoints.push({
      x: endX,
      y: getGroundSurfaceYAtX(groundPoints, endX),
    });
  }

  return smoothBoundaryPoints(
    sampledPoints,
    Math.max(0, Math.round(groundMaterialRenderConfig.grassCurveSmoothingPasses)),
  );
};

const buildGroundSurfacePoints = (
  groundPoints: Array<{ x: number; y: number }>,
  startX: number,
  endX: number,
) => {
  const sampleStep = Math.max(
    GROUND_STRIPE_WIDTH * 2,
    groundMaterialRenderConfig.grassCurveSampleStep,
  );
  const sampledPoints: Array<{ x: number; y: number }> = [];

  for (let x = startX; x <= endX; x += sampleStep) {
    sampledPoints.push({
      x,
      y: getGroundSurfaceYAtX(groundPoints, x),
    });
  }

  if ((sampledPoints.at(-1)?.x ?? startX) < endX) {
    sampledPoints.push({
      x: endX,
      y: getGroundSurfaceYAtX(groundPoints, endX),
    });
  }

  return sampledPoints;
};

const buildBottomBoundaryPoints = (
  startX: number,
  endX: number,
  bottomY: number,
  referenceCurve: Array<{ x: number; y: number }>,
) => {
  const sampleStep = Math.max(
    GROUND_STRIPE_WIDTH * 2,
    groundMaterialRenderConfig.grassCurveSampleStep,
  );
  const sampledPoints: Array<{ x: number; y: number }> = [];

  for (let x = startX; x <= endX; x += sampleStep) {
    sampledPoints.push({ x, y: bottomY });
  }

  if ((sampledPoints.at(-1)?.x ?? startX) < endX) {
    sampledPoints.push({ x: endX, y: bottomY });
  }

  if (sampledPoints.length === 0 && referenceCurve.length >= 2) {
    const [firstPoint] = referenceCurve;
    const lastPoint = referenceCurve.at(-1)!;
    return [
      { x: firstPoint!.x, y: bottomY },
      { x: lastPoint.x, y: bottomY },
    ];
  }

  return sampledPoints;
};

const fillBandBetweenCurves = (
  ctx: CanvasRenderingContext2D,
  upperCurve: Array<{ x: number; y: number }>,
  lowerCurve: Array<{ x: number; y: number }>,
  fillStyle: string | CanvasGradient,
) => {
  if (upperCurve.length < 2 || lowerCurve.length < 2) {
    return;
  }

  ctx.beginPath();
  buildSmoothPathThroughPoints(ctx, upperCurve);
  for (let index = lowerCurve.length - 1; index >= 0; index -= 1) {
    const point = lowerCurve[index]!;
    if (index === lowerCurve.length - 1) {
      ctx.lineTo(point.x, point.y);
      continue;
    }
    ctx.lineTo(point.x, point.y);
  }
  ctx.closePath();
  ctx.fillStyle = fillStyle;
  ctx.fill();
};

const drawMaterialBoundaryLine = (
  ctx: CanvasRenderingContext2D,
  points: Array<{ x: number; y: number }>,
  strokeStyle: string,
  lineWidth: number,
) => {
  if (points.length < 2) {
    return;
  }

  ctx.beginPath();
  buildSmoothPathThroughPoints(ctx, points);
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = lineWidth;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.stroke();
};

const drawGroundPath = (ctx: CanvasRenderingContext2D, snapshot: GameSnapshot) => {
  for (const groundPath of snapshot.groundPaths) {
    const [firstPoint, ...restPoints] = groundPath.points;
    if (!firstPoint) {
      continue;
    }

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(firstPoint.x, firstPoint.y);
    for (const point of restPoints) {
      ctx.lineTo(point.x, point.y);
    }
    const lastPoint = restPoints.at(-1) ?? firstPoint;
    ctx.lineTo(lastPoint.x, snapshot.height);
    ctx.lineTo(firstPoint.x, snapshot.height);
    ctx.closePath();
    ctx.clip();

    const minX = Math.floor(firstPoint.x);
    const maxX = Math.ceil(lastPoint.x);
    const surfaceBoundaryPoints = buildGroundSurfacePoints(groundPath.points, minX, maxX);
    const grassBoundaryPoints = sampleMaterialBoundaryPoints(
      groundPath.points,
      minX,
      maxX,
      snapshot.height,
      groundMaterialRenderConfig.a1,
      (slopeAbs) => slopeAbs < groundMaterialRenderConfig.noGrassSlope,
    );
    const rockBoundaryPoints = sampleMaterialBoundaryPoints(
      groundPath.points,
      minX,
      maxX,
      snapshot.height,
      groundMaterialRenderConfig.a2,
      () => true,
    );
    const bottomBoundaryPoints = buildBottomBoundaryPoints(minX, maxX, snapshot.height, rockBoundaryPoints);

    const boundaryMidpoint = getCurveMidpoint(surfaceBoundaryPoints) ?? firstPoint;
    const boundarySlopeAbs = Math.abs(getSlopeAtX(groundPath.points, boundaryMidpoint.x));
    const boundaryNoise = layeredTerrainNoise(
      boundaryMidpoint.x * groundMaterialRenderConfig.noiseScale * 40,
    );
    const boundaryCliffFactor = smoothstep(
      groundMaterialRenderConfig.cliffStart,
      groundMaterialRenderConfig.cliffEnd,
      boundarySlopeAbs,
    );

    const grassFill = ctx.createLinearGradient(0, firstPoint.y, 0, snapshot.height);
    grassFill.addColorStop(0, getMaterialColor("grass", boundaryCliffFactor * 0.4, boundaryNoise * 0.7));
    grassFill.addColorStop(1, getMaterialColor("grass", boundaryCliffFactor, boundaryNoise));

    const soilFill = ctx.createLinearGradient(0, firstPoint.y, 0, snapshot.height);
    soilFill.addColorStop(0, getMaterialColor("soil", boundaryCliffFactor * 0.75, boundaryNoise * 0.75));
    soilFill.addColorStop(1, getMaterialColor("soil", boundaryCliffFactor, boundaryNoise));

    const rockFill = ctx.createLinearGradient(0, firstPoint.y, 0, snapshot.height);
    rockFill.addColorStop(0, getMaterialColor("rock", boundaryCliffFactor * 0.8, boundaryNoise * 0.7));
    rockFill.addColorStop(1, getMaterialColor("rock", boundaryCliffFactor + 0.1, boundaryNoise));

    fillBandBetweenCurves(ctx, surfaceBoundaryPoints, grassBoundaryPoints, grassFill);
    fillBandBetweenCurves(ctx, grassBoundaryPoints, rockBoundaryPoints, soilFill);
    fillBandBetweenCurves(ctx, rockBoundaryPoints, bottomBoundaryPoints, rockFill);

    drawMaterialBoundaryLine(ctx, grassBoundaryPoints, "rgba(100, 126, 60, 0.58)", 2.2);
    drawMaterialBoundaryLine(ctx, rockBoundaryPoints, "rgba(96, 82, 64, 0.52)", 2);

    ctx.beginPath();
    ctx.moveTo(firstPoint.x, firstPoint.y);
    for (const point of restPoints) {
      ctx.lineTo(point.x, point.y);
    }
    const edgeSlopeAbs = Math.abs(getSlopeAtX(groundPath.points, (firstPoint.x + lastPoint.x) * 0.5));
    const edgeNoise = layeredTerrainNoise(
      ((firstPoint.x + lastPoint.x) * 0.5) * groundMaterialRenderConfig.noiseScale * 40,
    );
    ctx.strokeStyle = mixSurfaceEdgeColor(edgeSlopeAbs, edgeNoise);
    ctx.lineWidth = 5;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.stroke();
    ctx.restore();
  }
};

const drawCeilingPath = (ctx: CanvasRenderingContext2D, snapshot: GameSnapshot) => {
  for (const ceilingPath of snapshot.ceilingPaths) {
    const [firstPoint, ...restPoints] = ceilingPath.points;
    if (!firstPoint) {
      continue;
    }

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(firstPoint.x, firstPoint.y);
    for (const point of restPoints) {
      ctx.lineTo(point.x, point.y);
    }
    const lastPoint = restPoints.at(-1) ?? firstPoint;
    const closurePoints = buildCeilingClosurePoints(snapshot, lastPoint, firstPoint);
    for (const point of closurePoints) {
      ctx.lineTo(point.x, point.y);
    }
    ctx.closePath();

    const fill = ctx.createLinearGradient(0, 0, 0, Math.max(firstPoint.y, lastPoint.y, snapshot.height));
    fill.addColorStop(0, "#6b5a4a");
    fill.addColorStop(1, "#8b745f");
    ctx.fillStyle = fill;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(firstPoint.x, firstPoint.y);
    for (const point of restPoints) {
      ctx.lineTo(point.x, point.y);
    }
    ctx.strokeStyle = "#5f4a39";
    ctx.lineWidth = 5;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.stroke();
    ctx.restore();
  }
};

const drawSlingshot = (ctx: CanvasRenderingContext2D, snapshot: GameSnapshot) => {
  const bird = snapshot.bodies.find((body) => body.renderKind === "bird");
  if (!bird) {
    return;
  }

  const anchor = snapshot.slingshotAnchor;
  const baseY = getGroundSurfaceYAtX(snapshot.groundPaths[0]?.points ?? [], anchor.x);
  const trunkBottomY = baseY;
  const leftForkX = anchor.x - 16;
  const rightForkX = anchor.x + 16;
  const forkJoinY = anchor.y + 28;
  const leftForkY = anchor.y - 10;
  const rightForkY = anchor.y - 10;

  ctx.save();
  ctx.strokeStyle = "#6f4320";
  ctx.lineWidth = 10;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.beginPath();
  ctx.moveTo(anchor.x, trunkBottomY);
  ctx.moveTo(anchor.x, forkJoinY);
  ctx.lineTo(leftForkX, leftForkY);
  ctx.moveTo(anchor.x, forkJoinY);
  ctx.lineTo(rightForkX, rightForkY);
  ctx.stroke();

  ctx.fillStyle = "#6f4320";
  ctx.beginPath();
  ctx.arc(anchor.x, forkJoinY, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#7b4b26";
  ctx.beginPath();
  ctx.ellipse(anchor.x, baseY + 4, 18, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  if (!snapshot.birdLaunched || snapshot.isDragging) {
    ctx.strokeStyle = "#a46335";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(leftForkX, leftForkY + 2);
    ctx.lineTo(bird.position.x - 4, bird.position.y);
    ctx.moveTo(rightForkX, rightForkY + 2);
    ctx.lineTo(bird.position.x + 4, bird.position.y);
    ctx.stroke();
  }

  ctx.restore();
};

const drawBody = (ctx: CanvasRenderingContext2D, body: GameBody) => {
  ctx.save();
  ctx.translate(body.position.x, body.position.y);
  ctx.rotate(body.angle);

  switch (body.renderKind) {
    case "ground": {
      break;
    }
    case "block": {
      const entity = body.plugin.gameEntity;
      ctx.fillStyle = getBlockFillStyle(body);
      if (traceRenderRectangle(ctx, body) || traceBodyPolygon(ctx, body)) {
        ctx.fill();
      }

      const halfWidth = body.renderWidth ? body.renderWidth / 2 : undefined;
      const halfHeight = body.renderHeight ? body.renderHeight / 2 : undefined;

      if (entity?.kind === "block" && entity.state === "cracking") {
        ctx.strokeStyle = "rgba(255, 244, 214, 0.8)";
        ctx.lineWidth = 3;
        if (traceRenderRectangle(ctx, body) || traceBodyPolygon(ctx, body)) {
          ctx.stroke();
        }
      }

      if ((body.damageVisuals?.cracks.length ?? 0) > 0 && halfWidth && halfHeight) {
        ctx.strokeStyle = "rgba(92, 48, 26, 0.82)";
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        for (const crack of body.damageVisuals?.cracks ?? []) {
          const [start, ...rest] = crack.points;
          if (!start) {
            continue;
          }

          ctx.beginPath();
          ctx.moveTo(start.x, start.y);
          for (const point of rest) {
            ctx.lineTo(
              Math.max(-halfWidth, Math.min(halfWidth, point.x)),
              Math.max(-halfHeight, Math.min(halfHeight, point.y)),
            );
          }
          ctx.stroke();
        }
      }

      if (body.plugin.statusEffects?.some((effect: StatusEffectInstance) => effect.kind === "burn")) {
        ctx.fillStyle = "rgba(251, 146, 60, 0.18)";
        if (traceRenderRectangle(ctx, body) || traceBodyPolygon(ctx, body)) {
          ctx.fill();
        }
      }
      break;
    }
    case "pig":
    case "bird": {
      const radius = (body.circleRadius ?? 0) * 1;
      if (body.renderKind === "pig") {
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fillStyle = "#7ac943";
        ctx.fill();

        ctx.fillStyle = "#5fa92d";
        ctx.beginPath();
        ctx.moveTo(-radius * 0.45, -radius * 0.72);
        ctx.lineTo(-radius * 0.08, -radius * 0.98);
        ctx.lineTo(-radius * 0.02, -radius * 0.5);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(radius * 0.1, -radius * 0.78);
        ctx.lineTo(radius * 0.48, -radius * 0.94);
        ctx.lineTo(radius * 0.34, -radius * 0.46);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = "#9fe169";
        ctx.beginPath();
        ctx.arc(radius * 0.34, radius * 0.06, radius * 0.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#325a17";
        ctx.beginPath();
        ctx.arc(radius * 0.2, -radius * 0.12, radius * 0.08, 0, Math.PI * 2);
        ctx.arc(radius * 0.5, -radius * 0.02, radius * 0.08, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#1d1d1d";
        ctx.beginPath();
        ctx.arc(radius * 0.2, -radius * 0.12, radius * 0.035, 0, Math.PI * 2);
        ctx.arc(radius * 0.5, -radius * 0.02, radius * 0.035, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#5fa92d";
        ctx.beginPath();
        ctx.arc(radius * 0.29, radius * 0.06, radius * 0.05, 0, Math.PI * 2);
        ctx.arc(radius * 0.45, radius * 0.06, radius * 0.05, 0, Math.PI * 2);
        ctx.fill();
      } else if (body.plugin.skillProjectile?.kind === "vertical_bomb") {
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fillStyle = "#111827";
        ctx.fill();
        ctx.strokeStyle = "#fbbf24";
        ctx.lineWidth = 2;
        ctx.stroke();
      } else {
        const entity = body.plugin.gameEntity;
        const fillColor = entity?.kind === "bird" ? entity.fillColor : "#d84a3f";
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fillStyle = fillColor;
        ctx.fill();
      }

      if (body.plugin.statusEffects?.some((effect: StatusEffectInstance) => effect.kind === "poison")) {
        ctx.strokeStyle = "rgba(74, 222, 128, 0.72)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, radius * 1.12, 0, Math.PI * 2);
        ctx.stroke();
      }
      break;
    }
    default:
      break;
  }

  ctx.restore();
};

const drawBirdHud = (ctx: CanvasRenderingContext2D, snapshot: GameSnapshot) => {
  ctx.save();
  ctx.fillStyle = "rgba(255, 255, 255, 0.88)";
  ctx.fillRect(12, 12, 220, 34);
  ctx.strokeStyle = "rgba(31, 41, 55, 0.18)";
  ctx.strokeRect(12, 12, 220, 34);
  ctx.fillStyle = "#1f2937";
  ctx.font = "14px sans-serif";
  const hudLine = snapshot.awaitingBirdSelection
    ? `选择小鸟 · 剩余 ${snapshot.shotsRemaining} 次`
    : snapshot.activeBirdName
      ? `${snapshot.activeBirdName} · 剩余 ${snapshot.shotsRemaining} 次`
      : `剩余 ${snapshot.shotsRemaining} 次`;
  ctx.fillText(hudLine, 22, 34);
  ctx.restore();
};

const SKILL_VISUAL_COLORS: Record<string, string> = {
  speed_boost: "rgba(56, 189, 248, 0.35)",
  split: "rgba(125, 211, 252, 0.35)",
  balloon_push: "rgba(248, 113, 113, 0.28)",
  vertical_bomb_drop: "rgba(55, 65, 81, 0.25)",
  bomb_blast: "rgba(251, 191, 36, 0.42)",
  forward_shockwave: "rgba(96, 165, 250, 0.32)",
  radial_shockwave: "rgba(147, 197, 253, 0.34)",
  point_blast: "rgba(249, 115, 22, 0.38)",
  lightning_storm: "rgba(167, 139, 250, 0.34)",
  burn_aura: "rgba(251, 146, 60, 0.24)",
  poison_aura: "rgba(74, 222, 128, 0.22)",
};

const drawSkillVisuals = (ctx: CanvasRenderingContext2D, snapshot: GameSnapshot) => {
  for (const visual of snapshot.skillVisuals) {
    const fill = SKILL_VISUAL_COLORS[visual.kind] ?? "rgba(255,255,255,0.2)";
    ctx.beginPath();
    ctx.arc(visual.x, visual.y, visual.radius, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.45)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
};

export const drawScene = (
  ctx: CanvasRenderingContext2D,
  snapshot: GameSnapshot,
  zoom = 1,
  center = { x: snapshot.width / 2, y: snapshot.height / 2 },
  options?: {
    skipSky?: boolean;
  },
) => {
  ctx.clearRect(0, 0, snapshot.width, snapshot.height);

  if (!options?.skipSky) {
    const sky = ctx.createLinearGradient(0, 0, 0, snapshot.height);
    sky.addColorStop(0, "#d9efff");
    sky.addColorStop(1, "#f9fbef");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, snapshot.width, snapshot.height);
  }

  ctx.save();
  ctx.translate(snapshot.width / 2, snapshot.height / 2);
  ctx.scale(zoom, zoom);
  ctx.translate(-center.x, -center.y);

  drawCeilingPath(ctx, snapshot);
  drawGroundPath(ctx, snapshot);
  drawSlingshot(ctx, snapshot);

  for (const body of snapshot.bodies) {
    if (body.renderKind === "bird" && !snapshot.birdReadyOnSlingshot && !snapshot.birdLaunched) {
      continue;
    }

    if (body.renderKind !== "ground") {
      drawBody(ctx, body);
    }
  }

  drawSkillVisuals(ctx, snapshot);

  ctx.restore();
  drawBirdHud(ctx, snapshot);
};
