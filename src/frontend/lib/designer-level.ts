import type { LevelData, LevelEnemy, LevelObstacle } from "./level-contracts.js";

export type EditorTool = "select" | "rotate" | "add-wood" | "add-stone" | "add-glass" | "add-pig";
export type EditorClipboardEntity =
  | { kind: "obstacle"; entity: LevelObstacle }
  | { kind: "enemy"; entity: LevelEnemy };
export type EditorClipboardSelection = {
  entities: EditorClipboardEntity[];
  primaryEntityId: string | null;
};

export type EditorEntity =
  | { kind: "obstacle"; entity: LevelObstacle }
  | { kind: "enemy"; entity: LevelEnemy };

export type EditorSelectionBox = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

export type EditorGroupTransformSnapshotEntity = {
  entityId: string;
  entity: EditorEntity;
};

export type EditorGroupTransformSnapshot = {
  bounds: EditorSelectionBox;
  entities: EditorGroupTransformSnapshotEntity[];
};

export type EditorSelectionHandle = "top-left" | "top-right" | "bottom-left" | "bottom-right";

export type EditorSelectionFrame = {
  centerX: number;
  centerY: number;
  width: number;
  height: number;
  rotation: number;
};

export type EditorEntityBounds = {
  left: number;
  right: number;
  top: number;
  bottom: number;
  centerX: number;
  centerY: number;
};

type ProjectedSelectionBounds = {
  minU: number;
  maxU: number;
  minV: number;
  maxV: number;
};

export const DEFAULT_PIG_DIAMETER = 56;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const getNextId = (prefix: string, existingIds: string[]) => {
  let index = 1;
  while (existingIds.includes(`${prefix}-${index}`)) {
    index += 1;
  }

  return `${prefix}-${index}`;
};

const rotateVector = (x: number, y: number, angle: number) => ({
  x: x * Math.cos(angle) - y * Math.sin(angle),
  y: x * Math.sin(angle) + y * Math.cos(angle),
});

export const normalizeAngle = (angle: number) => {
  if (angle > Math.PI) {
    return angle - Math.PI * 2;
  }
  if (angle < -Math.PI) {
    return angle + Math.PI * 2;
  }
  return angle;
};

const dot = (ax: number, ay: number, bx: number, by: number) => ax * bx + ay * by;

const clampScalar = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const getObstacleCorners = (obstacle: Pick<LevelObstacle, "position" | "size" | "angle">) => {
  const halfWidth = obstacle.size.width / 2;
  const halfHeight = obstacle.size.height / 2;
  const angle = obstacle.angle ?? 0;

  return [
    rotateVector(-halfWidth, -halfHeight, angle),
    rotateVector(halfWidth, -halfHeight, angle),
    rotateVector(halfWidth, halfHeight, angle),
    rotateVector(-halfWidth, halfHeight, angle),
  ].map((corner) => ({
    x: obstacle.position.x + corner.x,
    y: obstacle.position.y + corner.y,
  }));
};

const getProjectedSelectionBounds = (
  entities: EditorEntity[],
  rotation: number,
): ProjectedSelectionBounds | null => {
  if (entities.length === 0) {
    return null;
  }

  const axisU = {
    x: Math.cos(rotation),
    y: Math.sin(rotation),
  };
  const axisV = {
    x: -Math.sin(rotation),
    y: Math.cos(rotation),
  };

  return entities.reduce<ProjectedSelectionBounds>(
    (accumulator, entity) => {
      if (entity.kind === "obstacle") {
        const corners = getObstacleCorners(entity.entity);
        const projectedU = corners.map((corner) => dot(corner.x, corner.y, axisU.x, axisU.y));
        const projectedV = corners.map((corner) => dot(corner.x, corner.y, axisV.x, axisV.y));
        return {
          minU: Math.min(accumulator.minU, ...projectedU),
          maxU: Math.max(accumulator.maxU, ...projectedU),
          minV: Math.min(accumulator.minV, ...projectedV),
          maxV: Math.max(accumulator.maxV, ...projectedV),
        };
      }

      const centerU = dot(entity.entity.position.x, entity.entity.position.y, axisU.x, axisU.y);
      const centerV = dot(entity.entity.position.x, entity.entity.position.y, axisV.x, axisV.y);
      const radius = getEnemyRadius(entity.entity);
      return {
        minU: Math.min(accumulator.minU, centerU - radius),
        maxU: Math.max(accumulator.maxU, centerU + radius),
        minV: Math.min(accumulator.minV, centerV - radius),
        maxV: Math.max(accumulator.maxV, centerV + radius),
      };
    },
    {
      minU: Number.POSITIVE_INFINITY,
      maxU: Number.NEGATIVE_INFINITY,
      minV: Number.POSITIVE_INFINITY,
      maxV: Number.NEGATIVE_INFINITY,
    },
  );
};

const isEntityWithinWorld = (levelData: LevelData, entity: EditorEntity) => {
  const bounds = getEntityBounds(entity);
  return (
    bounds.left >= 0
    && bounds.right <= levelData.world.width
    && bounds.top >= 0
    && bounds.bottom <= levelData.world.height
  );
};

const getSelectionCenter = (selectionBox: EditorSelectionBox) => ({
  x: (selectionBox.minX + selectionBox.maxX) / 2,
  y: (selectionBox.minY + selectionBox.maxY) / 2,
});

const getSelectionBoxSize = (selectionBox: EditorSelectionBox) => ({
  width: selectionBox.maxX - selectionBox.minX,
  height: selectionBox.maxY - selectionBox.minY,
});

const rotatePointAround = (
  point: { x: number; y: number },
  center: { x: number; y: number },
  angle: number,
) => {
  const rotated = rotateVector(point.x - center.x, point.y - center.y, angle);
  return {
    x: center.x + rotated.x,
    y: center.y + rotated.y,
  };
};

const getOppositeSelectionCorner = (
  selectionBox: EditorSelectionBox,
  handle: EditorSelectionHandle,
) => {
  switch (handle) {
    case "top-left":
      return { x: selectionBox.maxX, y: selectionBox.maxY };
    case "top-right":
      return { x: selectionBox.minX, y: selectionBox.maxY };
    case "bottom-left":
      return { x: selectionBox.maxX, y: selectionBox.minY };
    case "bottom-right":
      return { x: selectionBox.minX, y: selectionBox.minY };
  }
};

export const getEntityById = (levelData: LevelData, entityId: string): EditorEntity | null => {
  const obstacle = levelData.obstacles.find((candidate) => candidate.id === entityId);
  if (obstacle) {
    return { kind: "obstacle", entity: obstacle };
  }

  const enemy = levelData.enemies.find((candidate) => candidate.id === entityId);
  if (enemy) {
    return { kind: "enemy", entity: enemy };
  }

  return null;
};

export const getEntityBounds = (entity: EditorEntity): EditorEntityBounds => {
  if (entity.kind === "obstacle") {
    const corners = getObstacleCorners(entity.entity);
    const xs = corners.map((corner) => corner.x);
    const ys = corners.map((corner) => corner.y);
    return {
      left: Math.min(...xs),
      right: Math.max(...xs),
      top: Math.min(...ys),
      bottom: Math.max(...ys),
      centerX: entity.entity.position.x,
      centerY: entity.entity.position.y,
    };
  }

  return {
    left: entity.entity.position.x - ((entity.entity.size?.width ?? DEFAULT_PIG_DIAMETER) / 2),
    right: entity.entity.position.x + ((entity.entity.size?.width ?? DEFAULT_PIG_DIAMETER) / 2),
    top: entity.entity.position.y - ((entity.entity.size?.height ?? DEFAULT_PIG_DIAMETER) / 2),
    bottom: entity.entity.position.y + ((entity.entity.size?.height ?? DEFAULT_PIG_DIAMETER) / 2),
    centerX: entity.entity.position.x,
    centerY: entity.entity.position.y,
  };
};

export const getEnemyDiameter = (enemy: Pick<LevelEnemy, "size">) => enemy.size?.width ?? DEFAULT_PIG_DIAMETER;
export const getEnemyRadius = (enemy: Pick<LevelEnemy, "size">) => getEnemyDiameter(enemy) / 2;

export const normalizeSelectionBox = (
  start: { x: number; y: number },
  end: { x: number; y: number },
): EditorSelectionBox => ({
  minX: Math.min(start.x, end.x),
  minY: Math.min(start.y, end.y),
  maxX: Math.max(start.x, end.x),
  maxY: Math.max(start.y, end.y),
});

export const snapPointToGrid = (point: { x: number; y: number }, gridSize: number) => ({
  x: Math.round(point.x / gridSize) * gridSize,
  y: Math.round(point.y / gridSize) * gridSize,
});

export const snapEntityCenterToGrid = (
  levelData: LevelData,
  _entity: EditorEntity,
  point: { x: number; y: number },
  gridSize: number,
) => {
  const snappedPoint = snapPointToGrid(point, gridSize);
  return clampPositionToWorld(levelData, snappedPoint.x, snappedPoint.y);
};

export const selectSingleEntity = (entityId: string | null) => (entityId ? [entityId] : []);

export const addEntityToSelection = (selectedIds: string[], entityId: string) =>
  selectedIds.includes(entityId) ? selectedIds : [...selectedIds, entityId];

export const toggleEntityInSelection = (selectedIds: string[], entityId: string) =>
  selectedIds.includes(entityId)
    ? selectedIds.filter((candidate) => candidate !== entityId)
    : [...selectedIds, entityId];

export const getSelectionBounds = (
  levelData: LevelData,
  entityIds: string[],
): EditorSelectionBox | null => {
  const bounds = entityIds
    .map((entityId) => getEntityById(levelData, entityId))
    .filter((entity): entity is EditorEntity => entity !== null)
    .map((entity) => getEntityBounds(entity));

  if (bounds.length === 0) {
    return null;
  }

  return {
    minX: Math.min(...bounds.map((item) => item.left)),
    minY: Math.min(...bounds.map((item) => item.top)),
    maxX: Math.max(...bounds.map((item) => item.right)),
    maxY: Math.max(...bounds.map((item) => item.bottom)),
  };
};

const getSelectionFrameFromEntities = (
  entities: EditorEntity[],
  rotation: number,
  centerOverride?: { x: number; y: number },
): EditorSelectionFrame | null => {
  if (entities.length === 0) {
    return null;
  }

  const projectedBounds = getProjectedSelectionBounds(entities, rotation);
  if (!projectedBounds) {
    return null;
  }

  const axisU = {
    x: Math.cos(rotation),
    y: Math.sin(rotation),
  };
  const axisV = {
    x: -Math.sin(rotation),
    y: Math.cos(rotation),
  };
  const selectionCenter = centerOverride ?? {
    x: axisU.x * ((projectedBounds.minU + projectedBounds.maxU) / 2) + axisV.x * ((projectedBounds.minV + projectedBounds.maxV) / 2),
    y: axisU.y * ((projectedBounds.minU + projectedBounds.maxU) / 2) + axisV.y * ((projectedBounds.minV + projectedBounds.maxV) / 2),
  };

  return {
    centerX: selectionCenter.x,
    centerY: selectionCenter.y,
    width: projectedBounds.maxU - projectedBounds.minU,
    height: projectedBounds.maxV - projectedBounds.minV,
    rotation,
  };
};

const getMinimumAreaSelectionFrameFromEntities = (
  entities: EditorEntity[],
): EditorSelectionFrame | null => {
  if (entities.length === 0) {
    return null;
  }

  let bestFrame: EditorSelectionFrame | null = null;
  let bestArea = Number.POSITIVE_INFINITY;

  const evaluateRotation = (rotation: number) => {
    const frame = getSelectionFrameFromEntities(entities, rotation);
    if (!frame) {
      return;
    }

    const area = frame.width * frame.height;
    if (area < bestArea) {
      bestArea = area;
      bestFrame = frame;
    }
  };

  const coarseStep = Math.PI / 180;
  for (let rotation = 0; rotation < Math.PI / 2; rotation += coarseStep) {
    evaluateRotation(rotation);
  }
  evaluateRotation(Math.PI / 2);

  if (!bestFrame) {
    return null;
  }

  const coarseBestFrame: EditorSelectionFrame = bestFrame;
  const fineStep = Math.PI / 1800;
  const fineStart = Math.max(0, coarseBestFrame.rotation - coarseStep);
  const fineEnd = Math.min(Math.PI / 2, coarseBestFrame.rotation + coarseStep);
  for (let rotation = fineStart; rotation <= fineEnd; rotation += fineStep) {
    evaluateRotation(rotation);
  }
  evaluateRotation(fineEnd);

  return bestFrame;
};

export const getSelectionFrame = (
  levelData: LevelData,
  entityIds: string[],
  rotation: number,
  centerOverride?: { x: number; y: number },
): EditorSelectionFrame | null =>
  getSelectionFrameFromEntities(
    entityIds
      .map((entityId) => getEntityById(levelData, entityId))
      .filter((entity): entity is EditorEntity => entity !== null),
    rotation,
    centerOverride,
  );

export const getMinimumAreaSelectionFrame = (
  levelData: LevelData,
  entityIds: string[],
): EditorSelectionFrame | null =>
  getMinimumAreaSelectionFrameFromEntities(
    entityIds
      .map((entityId) => getEntityById(levelData, entityId))
      .filter((entity): entity is EditorEntity => entity !== null),
  );

export const getSelectionFrameFromSnapshot = (
  snapshot: EditorGroupTransformSnapshot,
  rotation: number,
  centerOverride?: { x: number; y: number },
): EditorSelectionFrame | null =>
  getSelectionFrameFromEntities(
    snapshot.entities.map((entity) => entity.entity),
    rotation,
    centerOverride,
  );

export const getSelectionBoundsFromHandle = (
  selectionBox: EditorSelectionBox,
  handle: EditorSelectionHandle,
  point: { x: number; y: number },
  minSize = 8,
): EditorSelectionBox => {
  const anchor = getOppositeSelectionCorner(selectionBox, handle);

  switch (handle) {
    case "top-left":
      return {
        minX: Math.min(point.x, anchor.x - minSize),
        minY: Math.min(point.y, anchor.y - minSize),
        maxX: anchor.x,
        maxY: anchor.y,
      };
    case "top-right":
      return {
        minX: anchor.x,
        minY: Math.min(point.y, anchor.y - minSize),
        maxX: Math.max(point.x, anchor.x + minSize),
        maxY: anchor.y,
      };
    case "bottom-left":
      return {
        minX: Math.min(point.x, anchor.x - minSize),
        minY: anchor.y,
        maxX: anchor.x,
        maxY: Math.max(point.y, anchor.y + minSize),
      };
    case "bottom-right":
      return {
        minX: anchor.x,
        minY: anchor.y,
        maxX: Math.max(point.x, anchor.x + minSize),
        maxY: Math.max(point.y, anchor.y + minSize),
      };
  }
};

export const getSelectionFrameFromHandle = (
  frame: EditorSelectionFrame,
  handle: EditorSelectionHandle,
  point: { x: number; y: number },
  minSize = 8,
): EditorSelectionFrame => {
  const center = { x: frame.centerX, y: frame.centerY };
  const localPoint = rotatePointAround(point, center, -frame.rotation);
  const localBounds = {
    minX: center.x - frame.width / 2,
    minY: center.y - frame.height / 2,
    maxX: center.x + frame.width / 2,
    maxY: center.y + frame.height / 2,
  };
  const nextBounds = getSelectionBoundsFromHandle(localBounds, handle, localPoint, minSize);

  return {
    centerX: (nextBounds.minX + nextBounds.maxX) / 2,
    centerY: (nextBounds.minY + nextBounds.maxY) / 2,
    width: nextBounds.maxX - nextBounds.minX,
    height: nextBounds.maxY - nextBounds.minY,
    rotation: frame.rotation,
  };
};

export const getEntitiesInSelectionBox = (
  levelData: LevelData,
  selectionBox: EditorSelectionBox,
) => {
  const entities = [
    ...levelData.obstacles.map((entity) => ({ kind: "obstacle", entity } as const)),
    ...levelData.enemies.map((entity) => ({ kind: "enemy", entity } as const)),
  ];

  return entities
    .filter((entity) => {
      const bounds = getEntityBounds(entity);
      return (
        bounds.left >= selectionBox.minX
        && bounds.right <= selectionBox.maxX
        && bounds.top >= selectionBox.minY
        && bounds.bottom <= selectionBox.maxY
      );
    })
    .map((entity) => entity.entity.id);
};

const getPolygonAxes = (corners: Array<{ x: number; y: number }>) =>
  corners.map((corner, index) => {
    const nextCorner = corners[(index + 1) % corners.length] ?? corners[0]!;
    const edgeX = nextCorner.x - corner.x;
    const edgeY = nextCorner.y - corner.y;
    const length = Math.hypot(edgeX, edgeY) || 1;
    return {
      x: -edgeY / length,
      y: edgeX / length,
    };
  });

const projectPolygon = (
  corners: Array<{ x: number; y: number }>,
  axis: { x: number; y: number },
) => {
  const projections = corners.map((corner) => dot(corner.x, corner.y, axis.x, axis.y));
  return {
    min: Math.min(...projections),
    max: Math.max(...projections),
  };
};

const polygonsOverlap = (
  first: Array<{ x: number; y: number }>,
  second: Array<{ x: number; y: number }>,
) => {
  const axes = [...getPolygonAxes(first), ...getPolygonAxes(second)];

  return axes.every((axis) => {
    const firstProjection = projectPolygon(first, axis);
    const secondProjection = projectPolygon(second, axis);
    return firstProjection.max > secondProjection.min && secondProjection.max > firstProjection.min;
  });
};

const circlesOverlap = (
  first: Pick<LevelEnemy, "position" | "size">,
  second: Pick<LevelEnemy, "position" | "size">,
) => {
  const deltaX = first.position.x - second.position.x;
  const deltaY = first.position.y - second.position.y;
  const firstRadius = getEnemyRadius(first);
  const secondRadius = getEnemyRadius(second);
  return deltaX * deltaX + deltaY * deltaY < (firstRadius + secondRadius) ** 2;
};

const circleIntersectsObstacle = (
  enemy: Pick<LevelEnemy, "position" | "size">,
  obstacle: Pick<LevelObstacle, "position" | "size" | "angle">,
) => {
  const angle = obstacle.angle ?? 0;
  const localCenter = rotateVector(
    enemy.position.x - obstacle.position.x,
    enemy.position.y - obstacle.position.y,
    -angle,
  );
  const halfWidth = obstacle.size.width / 2;
  const halfHeight = obstacle.size.height / 2;
  const nearestX = clampScalar(localCenter.x, -halfWidth, halfWidth);
  const nearestY = clampScalar(localCenter.y, -halfHeight, halfHeight);
  const deltaX = localCenter.x - nearestX;
  const deltaY = localCenter.y - nearestY;
  const radius = getEnemyRadius(enemy);
  return deltaX * deltaX + deltaY * deltaY < radius ** 2;
};

const entitiesOverlap = (first: EditorEntity, second: EditorEntity) => {
  if (first.kind === "obstacle" && second.kind === "obstacle") {
    return polygonsOverlap(getObstacleCorners(first.entity), getObstacleCorners(second.entity));
  }

  if (first.kind === "enemy" && second.kind === "enemy") {
    return circlesOverlap(first.entity, second.entity);
  }

  if (first.kind === "enemy" && second.kind === "obstacle") {
    return circleIntersectsObstacle(first.entity, second.entity);
  }

  if (first.kind === "obstacle" && second.kind === "enemy") {
    return circleIntersectsObstacle(second.entity, first.entity);
  }

  return false;
};

const hasOverlapWithExisting = (
  levelData: LevelData,
  candidate: EditorEntity,
  ignoredEntityIds: string[] = [],
) => {
  const obstacles = levelData.obstacles
    .filter((obstacle) => !ignoredEntityIds.includes(obstacle.id))
    .map((obstacle) => ({ kind: "obstacle", entity: obstacle } as const));
  const enemies = levelData.enemies
    .filter((enemy) => !ignoredEntityIds.includes(enemy.id))
    .map((enemy) => ({ kind: "enemy", entity: enemy } as const));

  return [...obstacles, ...enemies].some((entity) => entitiesOverlap(candidate, entity));
};

export const canPlaceEntity = (
  levelData: LevelData,
  candidate: EditorEntity,
  ignoredEntityId?: string,
) => isEntityWithinWorld(levelData, candidate) && !hasOverlapWithExisting(
  levelData,
  candidate,
  ignoredEntityId ? [ignoredEntityId] : [],
);

export const canPlaceEntities = (
  levelData: LevelData,
  candidates: EditorEntity[],
  ignoredEntityIds: string[] = [],
) => {
  if (candidates.some((candidate) => !isEntityWithinWorld(levelData, candidate))) {
    return false;
  }

  for (let index = 0; index < candidates.length; index += 1) {
    const candidate = candidates[index]!;
    if (hasOverlapWithExisting(levelData, candidate, ignoredEntityIds)) {
      return false;
    }

    for (let otherIndex = index + 1; otherIndex < candidates.length; otherIndex += 1) {
      if (entitiesOverlap(candidate, candidates[otherIndex]!)) {
        return false;
      }
    }
  }

  return true;
};

export const createObstacleEntity = (
  material: LevelObstacle["material"],
  x: number,
  y: number,
): EditorEntity => ({
  kind: "obstacle",
  entity: {
    id: "preview",
    material,
    position: { x, y },
    angle: 0,
    size: material === "glass"
      ? { width: 24, height: 120 }
      : material === "stone"
        ? { width: 84, height: 84 }
        : { width: 56, height: 140 },
  },
});

export const createObstacleFromCorners = (
  levelData: LevelData,
  material: LevelObstacle["material"],
  start: { x: number; y: number },
  end: { x: number; y: number },
): LevelObstacle | null => {
  const selectionBox = normalizeSelectionBox(start, end);
  const width = selectionBox.maxX - selectionBox.minX;
  const height = selectionBox.maxY - selectionBox.minY;
  if (width < 8 || height < 8) {
    return null;
  }

  return {
    id: "preview",
    material,
    position: clampPositionToWorld(
      levelData,
      (selectionBox.minX + selectionBox.maxX) / 2,
      (selectionBox.minY + selectionBox.maxY) / 2,
    ),
    angle: 0,
    size: {
      width,
      height,
    },
  };
};

export const createPigEntity = (x: number, y: number): EditorEntity => ({
  kind: "enemy",
  entity: {
    id: "preview",
    type: "pig",
    position: { x, y },
    size: {
      width: DEFAULT_PIG_DIAMETER,
      height: DEFAULT_PIG_DIAMETER,
    },
  },
});

export const createPigFromCorners = (
  levelData: LevelData,
  start: { x: number; y: number },
  end: { x: number; y: number },
): LevelEnemy | null => {
  const deltaX = end.x - start.x;
  const deltaY = end.y - start.y;
  const side = Math.min(Math.abs(deltaX), Math.abs(deltaY));
  if (side < 8) {
    return null;
  }

  const targetCorner = {
    x: start.x + Math.sign(deltaX || 1) * side,
    y: start.y + Math.sign(deltaY || 1) * side,
  };

  return {
    id: "preview",
    type: "pig",
    position: clampPositionToWorld(
      levelData,
      (start.x + targetCorner.x) / 2,
      (start.y + targetCorner.y) / 2,
    ),
    size: {
      width: side,
      height: side,
    },
  };
};

export const getEntitySnapshot = (
  levelData: LevelData,
  entityId: string,
): EditorClipboardEntity | null => {
  const obstacle = levelData.obstacles.find((candidate) => candidate.id === entityId);
  if (obstacle) {
    return {
      kind: "obstacle",
      entity: {
        ...obstacle,
        position: { ...obstacle.position },
        size: { ...obstacle.size },
      },
    };
  }

  const enemy = levelData.enemies.find((candidate) => candidate.id === entityId);
  if (enemy) {
    return {
      kind: "enemy",
      entity: {
        ...enemy,
        position: { ...enemy.position },
      },
    };
  }

  return null;
};

export const getEntitySnapshots = (
  levelData: LevelData,
  entityIds: string[],
): EditorClipboardEntity[] =>
  entityIds
    .map((entityId) => getEntitySnapshot(levelData, entityId))
    .filter((entity): entity is EditorClipboardEntity => entity !== null);

export const getGroupTransformSnapshot = (
  levelData: LevelData,
  entityIds: string[],
): EditorGroupTransformSnapshot | null => {
  const entities = entityIds
    .map((entityId) => {
      const entity = getEntityById(levelData, entityId);
      return entity ? { entityId, entity } : null;
    })
    .filter((entity): entity is EditorGroupTransformSnapshotEntity => entity !== null);

  if (entities.length === 0) {
    return null;
  }

  const bounds = getSelectionBounds(levelData, entityIds);
  if (!bounds) {
    return null;
  }

  return {
    bounds,
    entities,
  };
};

export const clampPositionToWorld = (levelData: LevelData, x: number, y: number) => ({
  x: clamp(x, 0, levelData.world.width),
  y: clamp(y, 0, levelData.world.height),
});

export const addObstacleAt = (
  levelData: LevelData,
  material: LevelObstacle["material"],
  x: number,
  y: number,
): LevelData => {
  const position = clampPositionToWorld(levelData, x, y);
  const id = getNextId(
    `obstacle-${material}`,
    levelData.obstacles.map((obstacle) => obstacle.id),
  );

  const nextObstacle: LevelObstacle = {
    id,
    material,
    position,
    angle: 0,
    size: material === "glass"
      ? { width: 24, height: 120 }
      : material === "stone"
        ? { width: 84, height: 84 }
        : { width: 56, height: 140 },
  };
  if (hasOverlapWithExisting(levelData, { kind: "obstacle", entity: nextObstacle })) {
    return levelData;
  }

  return {
    ...levelData,
    obstacles: [...levelData.obstacles, nextObstacle],
  };
};

export const addObstacleFromCorners = (
  levelData: LevelData,
  material: LevelObstacle["material"],
  start: { x: number; y: number },
  end: { x: number; y: number },
): LevelData => {
  const nextObstacle = createObstacleFromCorners(levelData, material, start, end);
  if (!nextObstacle) {
    return levelData;
  }

  const id = getNextId(
    `obstacle-${material}`,
    levelData.obstacles.map((obstacle) => obstacle.id),
  );
  const obstacleWithId: LevelObstacle = {
    ...nextObstacle,
    id,
  };
  if (hasOverlapWithExisting(levelData, { kind: "obstacle", entity: obstacleWithId })) {
    return levelData;
  }

  return {
    ...levelData,
    obstacles: [...levelData.obstacles, obstacleWithId],
  };
};

export const addPigAt = (levelData: LevelData, x: number, y: number): LevelData => {
  const position = clampPositionToWorld(levelData, x, y);
  const id = getNextId(
    "enemy",
    levelData.enemies.map((enemy) => enemy.id),
  );

  const nextEnemy: LevelEnemy = {
    id,
    type: "pig",
    position,
    size: {
      width: DEFAULT_PIG_DIAMETER,
      height: DEFAULT_PIG_DIAMETER,
    },
  };
  if (hasOverlapWithExisting(levelData, { kind: "enemy", entity: nextEnemy })) {
    return levelData;
  }

  return {
    ...levelData,
    enemies: [...levelData.enemies, nextEnemy],
  };
};

export const addPigFromCorners = (
  levelData: LevelData,
  start: { x: number; y: number },
  end: { x: number; y: number },
): LevelData => {
  const nextEnemy = createPigFromCorners(levelData, start, end);
  if (!nextEnemy) {
    return levelData;
  }

  const id = getNextId(
    "enemy",
    levelData.enemies.map((enemy) => enemy.id),
  );
  const enemyWithId: LevelEnemy = {
    ...nextEnemy,
    id,
  };
  if (hasOverlapWithExisting(levelData, { kind: "enemy", entity: enemyWithId })) {
    return levelData;
  }

  return {
    ...levelData,
    enemies: [...levelData.enemies, enemyWithId],
  };
};

export const moveEntityTo = (
  levelData: LevelData,
  entityId: string,
  x: number,
  y: number,
): LevelData => {
  const position = clampPositionToWorld(levelData, x, y);
  const obstacleIndex = levelData.obstacles.findIndex((obstacle) => obstacle.id === entityId);
  if (obstacleIndex >= 0) {
    const movedObstacle: LevelObstacle = {
      ...levelData.obstacles[obstacleIndex]!,
      position,
      angle: levelData.obstacles[obstacleIndex]!.angle ?? 0,
    };
    if (hasOverlapWithExisting(levelData, { kind: "obstacle", entity: movedObstacle }, [entityId])) {
      return levelData;
    }

    return {
      ...levelData,
      obstacles: levelData.obstacles.map((obstacle, index) =>
        index === obstacleIndex
        ? movedObstacle
        : obstacle,
      ),
    };
  }

  const enemyIndex = levelData.enemies.findIndex((enemy) => enemy.id === entityId);
  if (enemyIndex >= 0) {
    const movedEnemy: LevelEnemy = {
      ...levelData.enemies[enemyIndex]!,
      position,
    };
    if (hasOverlapWithExisting(levelData, { kind: "enemy", entity: movedEnemy }, [entityId])) {
      return levelData;
    }

    return {
      ...levelData,
      enemies: levelData.enemies.map((enemy, index) =>
        index === enemyIndex
          ? movedEnemy
          : enemy,
      ),
    };
  }

  return levelData;
};

const applyGroupEntities = (
  levelData: LevelData,
  entities: EditorGroupTransformSnapshotEntity[],
): LevelData => {
  const ignoredEntityIds = entities.map((entity) => entity.entityId);
  const transformedEntities = entities.map((entity) => entity.entity);
  if (!canPlaceEntities(levelData, transformedEntities, ignoredEntityIds)) {
    return levelData;
  }

  return {
    ...levelData,
    obstacles: levelData.obstacles.map((obstacle) => {
      const replacement = entities.find(
        (entity): entity is EditorGroupTransformSnapshotEntity & { entity: Extract<EditorEntity, { kind: "obstacle" }> } =>
          entity.entityId === obstacle.id && entity.entity.kind === "obstacle",
      );
      return replacement ? replacement.entity.entity : obstacle;
    }),
    enemies: levelData.enemies.map((enemy) => {
      const replacement = entities.find(
        (entity): entity is EditorGroupTransformSnapshotEntity & { entity: Extract<EditorEntity, { kind: "enemy" }> } =>
          entity.entityId === enemy.id && entity.entity.kind === "enemy",
      );
      return replacement ? replacement.entity.entity : enemy;
    }),
  };
};

export const moveEntitiesByDelta = (
  levelData: LevelData,
  snapshot: EditorGroupTransformSnapshot,
  deltaX: number,
  deltaY: number,
): LevelData =>
  applyGroupEntities(
    levelData,
    snapshot.entities.map((item) => ({
      entityId: item.entityId,
      entity:
        item.entity.kind === "obstacle"
          ? {
              kind: "obstacle",
              entity: {
                ...item.entity.entity,
                position: {
                  x: item.entity.entity.position.x + deltaX,
                  y: item.entity.entity.position.y + deltaY,
                },
              },
            }
          : {
              kind: "enemy",
              entity: {
                ...item.entity.entity,
                position: {
                  x: item.entity.entity.position.x + deltaX,
                  y: item.entity.entity.position.y + deltaY,
                },
                size: item.entity.entity.size
                  ? { ...item.entity.entity.size }
                  : item.entity.entity.size,
              },
            },
    })),
  );

export const scaleEntitiesFromSelectionBounds = (
  levelData: LevelData,
  snapshot: EditorGroupTransformSnapshot,
  frame: EditorSelectionFrame,
  nextFrame: EditorSelectionFrame,
): LevelData => {
  const scaleX = nextFrame.width / Math.max(frame.width, 1);
  const scaleY = nextFrame.height / Math.max(frame.height, 1);
  const frameCenter = { x: frame.centerX, y: frame.centerY };
  const nextFrameCenterLocal = rotatePointAround(
    { x: nextFrame.centerX, y: nextFrame.centerY },
    frameCenter,
    -frame.rotation,
  );

  return applyGroupEntities(
    levelData,
    snapshot.entities.map((item) => {
      const localPosition = rotatePointAround(item.entity.entity.position, frameCenter, -frame.rotation);
      const nextPosition = {
        x: nextFrameCenterLocal.x + (localPosition.x - frameCenter.x) * scaleX,
        y: nextFrameCenterLocal.y + (localPosition.y - frameCenter.y) * scaleY,
      };
      const worldPosition = rotatePointAround(nextPosition, frameCenter, frame.rotation);

      if (item.entity.kind === "obstacle") {
        return {
          entityId: item.entityId,
          entity: {
            kind: "obstacle" as const,
            entity: {
              ...item.entity.entity,
              position: worldPosition,
              size: {
                width: item.entity.entity.size.width * scaleX,
                height: item.entity.entity.size.height * scaleY,
              },
            },
          },
        };
      }

      const diameter = (item.entity.entity.size?.width ?? DEFAULT_PIG_DIAMETER) * Math.min(scaleX, scaleY);
      return {
        entityId: item.entityId,
        entity: {
          kind: "enemy" as const,
          entity: {
            ...item.entity.entity,
            position: worldPosition,
            size: {
              width: diameter,
              height: diameter,
            },
          },
        },
      };
    }),
  );
};

export const rotateEntitiesAroundSelectionCenter = (
  levelData: LevelData,
  snapshot: EditorGroupTransformSnapshot,
  center: { x: number; y: number },
  deltaAngle: number,
): LevelData => {
  return applyGroupEntities(
    levelData,
    snapshot.entities.map((item) => {
      const offset = {
        x: item.entity.entity.position.x - center.x,
        y: item.entity.entity.position.y - center.y,
      };
      const rotatedOffset = rotateVector(offset.x, offset.y, deltaAngle);
      const nextPosition = {
        x: center.x + rotatedOffset.x,
        y: center.y + rotatedOffset.y,
      };

      if (item.entity.kind === "obstacle") {
        return {
          entityId: item.entityId,
          entity: {
            kind: "obstacle" as const,
            entity: {
              ...item.entity.entity,
              position: nextPosition,
              angle: normalizeAngle((item.entity.entity.angle ?? 0) + deltaAngle),
            },
          },
        };
      }

      return {
        entityId: item.entityId,
        entity: {
          kind: "enemy" as const,
          entity: {
            ...item.entity.entity,
            position: nextPosition,
            size: item.entity.entity.size
              ? { ...item.entity.entity.size }
              : item.entity.entity.size,
          },
        },
      };
    }),
  );
};

export const removeEntity = (levelData: LevelData, entityId: string): LevelData => {
  const nextObstacles = levelData.obstacles.filter((obstacle) => obstacle.id !== entityId);
  if (nextObstacles.length !== levelData.obstacles.length) {
    return {
      ...levelData,
      obstacles: nextObstacles,
    };
  }

  const nextEnemies = levelData.enemies.filter((enemy) => enemy.id !== entityId);
  if (nextEnemies.length !== levelData.enemies.length) {
    return {
      ...levelData,
      enemies: nextEnemies,
    };
  }

  return levelData;
};

export const updateObstacleSize = (
  levelData: LevelData,
  entityId: string,
  width: number,
  height: number,
): LevelData => {
  const nextWidth = clamp(width, 8, levelData.world.width);
  const nextHeight = clamp(height, 8, levelData.world.height);

  return {
    ...levelData,
    obstacles: levelData.obstacles.map((obstacle) =>
      obstacle.id === entityId
        ? {
            ...obstacle,
            size: {
              width: nextWidth,
              height: nextHeight,
            },
            angle: obstacle.angle ?? 0,
          }
        : obstacle,
    ),
  };
};

export const updateObstacleBounds = (
  levelData: LevelData,
  entityId: string,
  centerX: number,
  centerY: number,
  width: number,
  height: number,
): LevelData => {
  const position = clampPositionToWorld(levelData, centerX, centerY);
  const nextWidth = clamp(width, 8, levelData.world.width);
  const nextHeight = clamp(height, 8, levelData.world.height);
  const obstacle = levelData.obstacles.find((candidate) => candidate.id === entityId);
  if (!obstacle) {
    return levelData;
  }
  const resizedObstacle: LevelObstacle = {
    ...obstacle,
    position,
    size: {
      width: nextWidth,
      height: nextHeight,
    },
    angle: obstacle.angle ?? 0,
  };
  if (hasOverlapWithExisting(levelData, { kind: "obstacle", entity: resizedObstacle }, [entityId])) {
    return levelData;
  }

  return {
    ...levelData,
    obstacles: levelData.obstacles.map((obstacle) =>
      obstacle.id === entityId
        ? resizedObstacle
        : obstacle,
    ),
  };
};

export const updateObstacleAngle = (
  levelData: LevelData,
  entityId: string,
  angle: number,
): LevelData => ({
  ...levelData,
  obstacles: levelData.obstacles.map((obstacle) =>
    obstacle.id === entityId
      ? {
          ...obstacle,
          angle: normalizeAngle(angle),
        }
      : obstacle,
  ),
});

export const pasteClipboardEntity = (
  levelData: LevelData,
  clipboardEntity: EditorClipboardEntity,
  center: { x: number; y: number },
): { levelData: LevelData; entityId: string } | null => {
  if (clipboardEntity.kind === "obstacle") {
    const halfWidth = clipboardEntity.entity.size.width / 2;
    const halfHeight = clipboardEntity.entity.size.height / 2;
    const angle = clipboardEntity.entity.angle ?? 0;
    const corners = [
      rotateVector(-halfWidth, -halfHeight, angle),
      rotateVector(halfWidth, -halfHeight, angle),
      rotateVector(-halfWidth, halfHeight, angle),
      rotateVector(halfWidth, halfHeight, angle),
    ];
    const xs = corners.map((corner) => center.x + corner.x);
    const ys = corners.map((corner) => center.y + corner.y);
    if (
      Math.min(...xs) < 0
      || Math.max(...xs) > levelData.world.width
      || Math.min(...ys) < 0
      || Math.max(...ys) > levelData.world.height
    ) {
      return null;
    }

    const entityId = getNextId(
      `obstacle-${clipboardEntity.entity.material}`,
      levelData.obstacles.map((obstacle) => obstacle.id),
    );
    const nextObstacle: LevelObstacle = {
      ...clipboardEntity.entity,
      id: entityId,
      position: center,
      size: { ...clipboardEntity.entity.size },
    };
    if (hasOverlapWithExisting(levelData, { kind: "obstacle", entity: nextObstacle })) {
      return null;
    }

    return {
      entityId,
      levelData: {
        ...levelData,
        obstacles: [...levelData.obstacles, nextObstacle],
      },
    };
  }

  const entityId = getNextId(
    "enemy",
    levelData.enemies.map((enemy) => enemy.id),
  );
  if (
    center.x - getEnemyRadius(clipboardEntity.entity) < 0
    || center.x + getEnemyRadius(clipboardEntity.entity) > levelData.world.width
    || center.y - getEnemyRadius(clipboardEntity.entity) < 0
    || center.y + getEnemyRadius(clipboardEntity.entity) > levelData.world.height
  ) {
    return null;
  }
  const nextEnemy: LevelEnemy = {
    ...clipboardEntity.entity,
    id: entityId,
    position: center,
  };
  if (hasOverlapWithExisting(levelData, { kind: "enemy", entity: nextEnemy })) {
    return null;
  }

  return {
    entityId,
    levelData: {
      ...levelData,
      enemies: [...levelData.enemies, nextEnemy],
    },
  };
};

export const pasteClipboardSelection = (
  levelData: LevelData,
  clipboardSelection: EditorClipboardSelection,
  center: { x: number; y: number },
): { levelData: LevelData; entityIds: string[]; primaryEntityId: string | null } | null => {
  if (clipboardSelection.entities.length === 0) {
    return null;
  }

  const selectionBounds = clipboardSelection.entities
    .map((entity) => getEntityBounds(entity))
    .reduce(
      (accumulator, bounds) => ({
        minX: Math.min(accumulator.minX, bounds.left),
        minY: Math.min(accumulator.minY, bounds.top),
        maxX: Math.max(accumulator.maxX, bounds.right),
        maxY: Math.max(accumulator.maxY, bounds.bottom),
      }),
      {
        minX: Number.POSITIVE_INFINITY,
        minY: Number.POSITIVE_INFINITY,
        maxX: Number.NEGATIVE_INFINITY,
        maxY: Number.NEGATIVE_INFINITY,
      },
    );

  const sourceCenter = {
    x: (selectionBounds.minX + selectionBounds.maxX) / 2,
    y: (selectionBounds.minY + selectionBounds.maxY) / 2,
  };

  let nextLevelData = levelData;
  const pastedIds: string[] = [];
  let pastedPrimaryEntityId: string | null = null;

  for (const entity of clipboardSelection.entities) {
    const targetCenter = {
      x: center.x + (entity.entity.position.x - sourceCenter.x),
      y: center.y + (entity.entity.position.y - sourceCenter.y),
    };
    const pasted = pasteClipboardEntity(nextLevelData, entity, targetCenter);
    if (!pasted) {
      return null;
    }

    nextLevelData = pasted.levelData;
    pastedIds.push(pasted.entityId);
    if (entity.entity.id === clipboardSelection.primaryEntityId) {
      pastedPrimaryEntityId = pasted.entityId;
    }
  }

  return {
    levelData: nextLevelData,
    entityIds: pastedIds,
    primaryEntityId: pastedPrimaryEntityId ?? pastedIds.at(-1) ?? null,
  };
};
