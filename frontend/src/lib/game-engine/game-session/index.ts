import {
  Bodies,
  Body,
  Engine,
  Events,
  Sleeping,
  World,
  Vector,
  type IEventCollision,
  type Vector as MatterVector,
} from "matter-js";
import {
  BIRD_RADIUS,
  BLOCK_GROUND_DAMAGE_MULTIPLIER,
  DEFAULT_LEVEL_DATA,
  FIXED_TIMESTEP_MS,
  GRAVITY_Y,
  GROUND_HEIGHT,
  LAUNCH_POWER,
  LEVEL_GRAVITY_REFERENCE,
  MAX_ACCUMULATED_TIME_MS,
  MAX_DRAG_DISTANCE,
  PAIR_IMPACT_COOLDOWN_MS,
  PIG_DAMAGE_FACTOR,
  SETTLE_SPEED_THRESHOLD,
  SETTLE_TIME_MS,
  SLINGSHOT_X,
  SLINGSHOT_Y,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  attachGameEntity,
  createEnemyBody,
  createObstacleBody,
  getBlockEntity,
  scaleX,
  scaleY,
  setRenderKind,
  updateDamageVisuals,
} from "./config.js";
import {
  applyBeamSupportStabilization,
  applyBlockSupportStabilization,
  applyGroundSupportStabilization,
  applyPenetrationCorrection,
  applyPigBeamStabilization,
  applyPigSupportStabilization,
  applyRestingContactStabilization,
  clampBodyVelocity,
} from "./physics.js";
import {
  computeCollisionImpulse,
  computeEffectiveThickness,
  computeFractureResponse,
  computeVelocityPreservationRatio,
} from "../fracture.js";
import { MATERIAL_PARAMS } from "../materials.js";
import type { GameBody, GameSession, GameSnapshot } from "../types.js";
import type { LevelData } from "../../level-contracts.js";
import { MIN_DAMAGE_IMPULSE } from "../constants.js";
import { getGroundSurfaceYAtX, getLevelGround, getLevelTerrain, sampleBoundaryPathSegments, sampleGroundPath } from "../../ground.js";

// Game session
export const createGameSession = (levelDataInput?: LevelData): GameSession => {
  const engine = Engine.create();
  const levelData = levelDataInput ?? DEFAULT_LEVEL_DATA;
  engine.enableSleeping = true;
  engine.gravity.y = (levelData.world.gravity / LEVEL_GRAVITY_REFERENCE) * GRAVITY_Y;
  engine.positionIterations = 16;
  engine.velocityIterations = 12;
  engine.constraintIterations = 6;

  const width = WORLD_WIDTH;
  const height = WORLD_HEIGHT;
  const levelTerrain = getLevelTerrain(levelData);
  const levelGround = getLevelGround(levelData);
  const groundPathSegments = sampleBoundaryPathSegments(levelData, levelGround).map((segment) =>
    segment.map((point) => ({
      x: scaleX(point.x, levelData),
      y: scaleY(point.y, levelData),
    }))
  );
  const ceilingPathSegments = sampleBoundaryPathSegments(levelData, levelTerrain.ceilingBoundary).map((segment) =>
    segment.map((point) => ({
      x: scaleX(point.x, levelData),
      y: scaleY(point.y, levelData),
    }))
  );
  const buildBoundaryBodies = (
    pathPoints: Array<{ x: number; y: number }>,
    surfaceRole: "ground" | "ceiling",
    groundType: typeof levelGround.type,
  ) => pathPoints.slice(1).map((point, index) => {
    const previousPoint = pathPoints[index]!;
    const deltaX = point.x - previousPoint.x;
    const deltaY = point.y - previousPoint.y;
    const segmentLength = Math.max(1, Math.hypot(deltaX, deltaY));
    const angle = Math.atan2(deltaY, deltaX);
    const normalDown = {
      x: -deltaY / segmentLength,
      y: deltaX / segmentLength,
    };
    const normalOffset = surfaceRole === "ground" ? normalDown : { x: -normalDown.x, y: -normalDown.y };
    const center = {
      x: (previousPoint.x + point.x) / 2 + normalOffset.x * (GROUND_HEIGHT / 2),
      y: (previousPoint.y + point.y) / 2 + normalOffset.y * (GROUND_HEIGHT / 2),
    };

    const body = setRenderKind(
      Bodies.rectangle(center.x, center.y, segmentLength, GROUND_HEIGHT, {
        isStatic: true,
        angle,
        restitution: 0,
        friction: 1.6,
        frictionStatic: 3.2,
        slop: 0.01,
      }),
      "ground",
    );
    attachGameEntity(body, { kind: "ground", groundType, surfaceRole });
    return body;
  });
  const groundBodies = groundPathSegments.flatMap((segment) => buildBoundaryBodies(segment, "ground", levelGround.type));
  const ceilingBodies = ceilingPathSegments.flatMap((segment) => buildBoundaryBodies(segment, "ceiling", levelTerrain.ceilingBoundary?.type ?? "line"));
  const primaryGroundPathPoints = groundPathSegments.find((segment) => segment.length > 0) ?? sampleGroundPath(levelGround).map((point) => ({
    x: scaleX(point.x, levelData),
    y: scaleY(point.y, levelData),
  }));
  const groundSurfaceYAtSlingshot = getGroundSurfaceYAtX(primaryGroundPathPoints, SLINGSHOT_X);

  const bird = setRenderKind(
    Bodies.circle(SLINGSHOT_X, SLINGSHOT_Y, BIRD_RADIUS, {
      restitution: 0.025,
      friction: 0.8,
      frictionAir: 0.018,
      density: 0.0025,
      slop: 0.01,
    }),
    "bird",
  );

  Body.setStatic(bird, true);
  attachGameEntity(bird, { kind: "bird" });

  const obstacleBodies = levelData.obstacles.map((obstacle) => createObstacleBody(obstacle, levelData));
  const enemyBodies = levelData.enemies.map((enemy) => createEnemyBody(enemy, levelData));
  const bodies: GameBody[] = [...groundBodies, ...ceilingBodies, ...obstacleBodies, ...enemyBodies, bird];
  World.add(engine.world, bodies);

  let isDragging = false;
  let birdLaunched = false;
  let status: GameSnapshot["status"] = "ready";
  let settleTimeMs = 0;
  let initialSettleTimeMs = 0;
  let worldPrimed = false;
  let accumulatedTimeMs = 0;
  const recentPairImpacts = new Map<string, number>();

  const slingshotAnchor = {
    x: SLINGSHOT_X,
    y: SLINGSHOT_Y,
  };

  // Session/world state helpers
  const clampDragPosition = (x: number, y: number) => {
    const deltaX = x - slingshotAnchor.x;
    const deltaY = y - slingshotAnchor.y;
    const distance = Math.hypot(deltaX, deltaY);
    const maxBirdCenterY = groundSurfaceYAtSlingshot - BIRD_RADIUS - 6;

    if (distance <= MAX_DRAG_DISTANCE) {
      return {
        x,
        y: Math.min(y, maxBirdCenterY),
      };
    }

    const scale = MAX_DRAG_DISTANCE / distance;
    return {
      x: slingshotAnchor.x + deltaX * scale,
      y: Math.min(slingshotAnchor.y + deltaY * scale, maxBirdCenterY),
    };
  };

  const removeBody = (body: GameBody) => {
    if (body.destroyed) {
      return;
    }

    const blockEntity = getBlockEntity(body);
    if (blockEntity) {
      blockEntity.state = "broken";
      blockEntity.pendingRemoval = false;
    }

    body.destroyed = true;
    World.remove(engine.world, body);
  };

  // Damage and fracture handling
  const applyDamage = (body: GameBody, amount: number) => {
    const blockEntity = getBlockEntity(body);
    if (blockEntity) {
      if (body.destroyed || blockEntity.state === "broken" || blockEntity.state === "cracking") {
        return;
      }

      blockEntity.hp = Math.max(0, blockEntity.hp - amount);
      updateDamageVisuals(body);
      if (blockEntity.hp <= 0) {
        removeBody(body);
      }
      return;
    }

    if (body.destroyed || body.health === undefined) {
      return;
    }

    body.health = Math.max(0, body.health - amount);
    updateDamageVisuals(body);
    if (body.health <= 0) {
      removeBody(body);
    }
  };

  const getPairKey = (bodyA: GameBody, bodyB: GameBody) =>
    (bodyA.id < bodyB.id ? `${bodyA.id}:${bodyB.id}` : `${bodyB.id}:${bodyA.id}`);

  const applyImpulseDampingToBird = (
    birdBody: GameBody,
    normal: MatterVector,
    rawImpulse: number,
    effectiveImpulse: number,
  ) => {
    if (birdBody.renderKind !== "bird" || rawImpulse <= 0) {
      return;
    }

    const velocityAlongNormal = Vector.dot(birdBody.velocity, normal);
    if (velocityAlongNormal >= 0) {
      return;
    }

    const preservedRatio = computeVelocityPreservationRatio(rawImpulse, effectiveImpulse);
    const tangentialVelocity = Vector.sub(birdBody.velocity, Vector.mult(normal, velocityAlongNormal));
    const adjustedNormalVelocity = velocityAlongNormal * preservedRatio;

    Body.setVelocity(birdBody, Vector.add(tangentialVelocity, Vector.mult(normal, adjustedNormalVelocity)));
  };

  const shouldUseFractureModel = (targetBody: GameBody, otherBody: GameBody) => {
    if (targetBody.renderKind !== "block") {
      return false;
    }

    // 只对鸟的直接撞击启用延迟破裂，避免世界物体之间的接触把行为放大。
    return otherBody.renderKind === "bird";
  };

  const triggerFracture = (
    targetBody: GameBody,
    otherBody: GameBody,
    impactImpulse: number,
    normal: MatterVector,
    nowMs: number,
  ) => {
    const entity = getBlockEntity(targetBody);
    if (!entity || entity.state === "cracking" || entity.state === "broken") {
      return false;
    }

    const material = MATERIAL_PARAMS[entity.material];
    const effectiveThickness = computeEffectiveThickness(targetBody, normal);
    const fracture = computeFractureResponse(material, effectiveThickness, impactImpulse);

    entity.hp = 0;
    entity.state = "cracking";
    entity.crackStartTime = nowMs;
    entity.breakDuration = fracture.breakDuration;
    entity.effectiveThickness = effectiveThickness;
    entity.pendingRemoval = true;
    entity.collisionCooldownUntil = nowMs + fracture.breakDuration;
    updateDamageVisuals(targetBody);

    if (otherBody.renderKind === "bird") {
      applyImpulseDampingToBird(otherBody, normal, impactImpulse, fracture.effectiveImpulse);
    } else if (targetBody.renderKind === "bird") {
      applyImpulseDampingToBird(targetBody, Vector.neg(normal), impactImpulse, fracture.effectiveImpulse);
    }

    return true;
  };

  const applyBlockImpact = (
    targetBody: GameBody,
    otherBody: GameBody,
    impactImpulse: number,
    nowMs: number,
    normal: MatterVector,
  ) => {
    const entity = getBlockEntity(targetBody);
    if (!entity) {
      return;
    }

    if (entity.state === "cracking" || entity.state === "broken" || nowMs < entity.collisionCooldownUntil) {
      return;
    }

    const material = MATERIAL_PARAMS[entity.material];
    const multiplier =
      otherBody.renderKind === "bird"
        ? 1.1
        : otherBody.renderKind === "ground"
          ? BLOCK_GROUND_DAMAGE_MULTIPLIER
          : 0.7;
    const damage = impactImpulse * material.damageFactor * multiplier;

    if (shouldUseFractureModel(targetBody, otherBody) && impactImpulse >= material.fractureThreshold && damage >= entity.hp) {
      if (triggerFracture(targetBody, otherBody, impactImpulse, normal, nowMs)) {
        return;
      }
    }

    applyDamage(targetBody, damage);
    entity.collisionCooldownUntil = nowMs + 45;
  };

  // Collision event handlers
  const onCollisionStart = (event: IEventCollision<Engine>) => {
    if (!worldPrimed) {
      // 初始静置阶段不处理伤害，避免关卡刚载入就因为轻微抖动扣血。
      return;
    }

    const nowMs = engine.timing.timestamp;

    for (const pair of event.pairs) {
      const bodyA = pair.bodyA as GameBody;
      const bodyB = pair.bodyB as GameBody;
      if (bodyA.destroyed || bodyB.destroyed) {
        continue;
      }

      const pairKey = getPairKey(bodyA, bodyB);
      const lastImpactAt = recentPairImpacts.get(pairKey) ?? -Infinity;
      if (nowMs - lastImpactAt < PAIR_IMPACT_COOLDOWN_MS) {
        // 对同一对物体做一个短冷却，避免一帧内连打多次伤害。
        continue;
      }

      const impactImpulse = computeCollisionImpulse(bodyA, bodyB, pair.collision.normal);
      if (impactImpulse < MIN_DAMAGE_IMPULSE) {
        continue;
      }
      recentPairImpacts.set(pairKey, nowMs);

      const damages = [
        { body: bodyA, other: bodyB, normal: pair.collision.normal },
        { body: bodyB, other: bodyA, normal: Vector.neg(pair.collision.normal) },
      ];

      for (const entry of damages) {
        if (entry.body.renderKind === "pig") {
          const multiplier =
            entry.other.renderKind === "bird" ? 1.2 : entry.other.renderKind === "block" ? 1 : 0.45;
          applyDamage(entry.body, impactImpulse * PIG_DAMAGE_FACTOR * multiplier);
        }

        if (entry.body.renderKind === "block") {
          applyBlockImpact(entry.body, entry.other, impactImpulse, nowMs, entry.normal);
        }
      }
    }
  };

  const onCollisionActive = (event: IEventCollision<Engine>) => {
    for (const pair of event.pairs) {
      const bodyA = pair.bodyA as GameBody;
      const bodyB = pair.bodyB as GameBody;
      if (bodyA.destroyed || bodyB.destroyed) {
        continue;
      }

      if (
        bodyA.renderKind !== "block"
        && bodyB.renderKind !== "block"
        && bodyA.renderKind !== "ground"
        && bodyB.renderKind !== "ground"
      ) {
        continue;
      }

      const usesGroundSupportModel = applyGroundSupportStabilization(
        pair,
        bodyA,
        bodyB,
        pair.collision.normal,
        pair.collision.depth,
      );
      const usesBlockSupportModel = !usesGroundSupportModel
        && applyBlockSupportStabilization(bodyA, bodyB, pair.collision.normal, pair.collision.depth);
      const usesPigSupportModel = !usesGroundSupportModel
        && !usesBlockSupportModel
        && applyPigSupportStabilization(bodyA, bodyB, pair.collision.normal, pair.collision.depth);

      // 如果没有命中特化的支撑模型，再退回到通用的低速接触稳定化。
      if (!usesGroundSupportModel && !usesBlockSupportModel && !usesPigSupportModel) {
        applyRestingContactStabilization(bodyA, bodyB, pair.collision.normal);
      }

      applyBeamSupportStabilization(bodyA, bodyB, pair.collision.normal);
      applyPigBeamStabilization(bodyA, bodyB, pair.collision.normal);
    }
  };

  // Per-frame world update
  const onAfterUpdate = () => {
    for (const body of bodies) {
      if (body.isStatic || body.destroyed) {
        continue;
      }

      // 自定义稳定化不负责让物体睡眠，统一唤醒避免“低速即冻结”。
      if (body.isSleeping) {
        Sleeping.set(body, false);
      }

      clampBodyVelocity(body);

      const blockEntity = getBlockEntity(body);
      if (
        blockEntity
        && blockEntity.state === "cracking"
        && blockEntity.pendingRemoval
        && blockEntity.crackStartTime !== null
        && engine.timing.timestamp >= blockEntity.crackStartTime + blockEntity.breakDuration
      ) {
        blockEntity.state = "broken";
        removeBody(body);
        continue;
      }

      if (body.position.y > height + 300) {
        removeBody(body);
      }
    }

    applyPenetrationCorrection(bodies);

    const movingBodies = bodies.filter((body) => !body.destroyed && !body.isStatic);
    const isSettled = movingBodies.every(
      (body) => body.speed < SETTLE_SPEED_THRESHOLD && Math.abs(body.angularVelocity) < SETTLE_SPEED_THRESHOLD,
    );

    if (!worldPrimed) {
      // 只有整个世界连续稳定一段时间后，才允许玩家开始拖拽小鸟。
      if (isSettled) {
        initialSettleTimeMs += engine.timing.lastDelta;
        if (initialSettleTimeMs >= SETTLE_TIME_MS) {
          worldPrimed = true;
        }
      } else {
        initialSettleTimeMs = 0;
      }

      status = "ready";
      settleTimeMs = 0;
      return;
    }

    const livingPigs = bodies.filter((body) => body.renderKind === "pig" && !body.destroyed);
    const activeBird = !bird.destroyed;

    if (livingPigs.length === 0) {
      status = "won";
      return;
    }

    if (!birdLaunched) {
      status = isDragging ? "running" : "ready";
      settleTimeMs = 0;
      return;
    }

    if (!activeBird) {
      status = "lost";
      return;
    }

    if (isSettled) {
      settleTimeMs += engine.timing.lastDelta;
      if (settleTimeMs >= SETTLE_TIME_MS) {
        status = livingPigs.length === 0 ? "won" : "lost";
        return;
      }
    } else {
      settleTimeMs = 0;
    }

    status = "running";
  };

  Events.on(engine, "collisionStart", onCollisionStart);
  Events.on(engine, "collisionActive", onCollisionActive);
  Events.on(engine, "afterUpdate", onAfterUpdate);

  // Public session API
  const getSnapshot = (): GameSnapshot => ({
    width,
    height,
    bodies: bodies.filter((body) => !body.destroyed),
    groundPaths: groundPathSegments.map((points) => ({
      type: levelGround.type,
      points,
    })),
    ceilingPaths: ceilingPathSegments.map((points) => ({
      type: levelTerrain.ceilingBoundary?.type ?? "line",
      points,
    })),
    birdLaunched,
    isDragging,
    status,
    slingshotAnchor,
  });

  return {
    engine,
    getSnapshot,
    beginDrag: (x, y) => {
      if (birdLaunched || !worldPrimed) {
        return false;
      }

      const hitDistance = Math.hypot(x - bird.position.x, y - bird.position.y);
      if (hitDistance > BIRD_RADIUS * 1.8) {
        return false;
      }

      isDragging = true;
      status = "running";
      Body.setStatic(bird, true);
      Sleeping.set(bird, false);
      Body.setVelocity(bird, { x: 0, y: 0 });
      Body.setAngularVelocity(bird, 0);
      return true;
    },
    updateDrag: (x, y) => {
      if (!isDragging || birdLaunched) {
        return;
      }

      const position = clampDragPosition(x, y);
      Body.setPosition(bird, position);
      Body.setVelocity(bird, { x: 0, y: 0 });
      Body.setAngle(bird, 0);
      Body.setAngularVelocity(bird, 0);
    },
    endDrag: () => {
      if (!isDragging || birdLaunched) {
        isDragging = false;
        return;
      }

      isDragging = false;
      birdLaunched = true;
      settleTimeMs = 0;
      status = "running";
      Body.setStatic(bird, false);
      Sleeping.set(bird, false);
      Body.setVelocity(bird, {
        x: (slingshotAnchor.x - bird.position.x) * LAUNCH_POWER,
        y: (slingshotAnchor.y - bird.position.y) * LAUNCH_POWER,
      });
    },
    step: (deltaMs: number) => {
      accumulatedTimeMs = Math.min(accumulatedTimeMs + deltaMs, MAX_ACCUMULATED_TIME_MS);
      // 固定步长更新可降低不同帧率下的物理差异。
      while (accumulatedTimeMs >= FIXED_TIMESTEP_MS) {
        Engine.update(engine, FIXED_TIMESTEP_MS);
        accumulatedTimeMs -= FIXED_TIMESTEP_MS;
      }
    },
    destroy: () => {
      Events.off(engine, "collisionStart", onCollisionStart);
      Events.off(engine, "collisionActive", onCollisionActive);
      Events.off(engine, "afterUpdate", onAfterUpdate);
      World.clear(engine.world, false);
      Engine.clear(engine);
    },
  };
};
