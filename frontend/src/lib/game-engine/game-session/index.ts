import Matter from "matter-js";
import type { Engine as MatterEngine, IEventCollision } from "matter-js";
import {
  BIRD_RADIUS,
  DEFAULT_LEVEL_DATA,
  FIXED_TIMESTEP_MS,
  GRAVITY_Y,
  GROUND_HEIGHT,
  LAUNCH_POWER,
  LEVEL_GRAVITY_REFERENCE,
  MAX_ACCUMULATED_TIME_MS,
  MAX_DRAG_DISTANCE,
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
  COLLISION_CATEGORY_CEILING,
  COLLISION_CATEGORY_GROUND,
  COLLISION_MASK_BOUNDARY,
} from "./config.js";
import { createCombatResolver } from "./combat-resolver.js";
import {
  applyCombatProfileToBird,
} from "../combat-profile.js";
import { createCombatEffects } from "../skills/combat-effects.js";
import { createSkillEngine } from "../skills/skill-engine.js";
import {
  createBirdPoolTracker,
  type BirdPoolLaunchConfig,
} from "../bird-pool-session.js";
import {
  DEFAULT_BIRD_DEFINITION,
  listSystemBirdDefinitions,
  type BirdDefinition,
} from "../bird-definition.js";
import { normalizeBirdPool } from "../../bird-pool.js";
import {
  applyBeamSupportStabilization,
  applyBlockSupportStabilization,
  applyGroundSupportStabilization,
  applyPenetrationCorrection,
  applyPigBeamStabilization,
  applyPigSupportStabilization,
  applyRestingContactStabilization,
  clampBodyVelocity,
  keepBodiesAwakeDuringPriming,
  manageBodySleep,
  updateDynamicCollisionFilters,
  applyBirdCollisionFilter,
  markSettlingSupport,
  releaseStructureSupport,
  wakeDependentBodies,
  clearSupportCollapseOnContact,
  isCrackingBlock,
} from "./physics.js";
import type { GameBody, GameSession, GameSnapshot } from "../types.js";
import type { LevelData } from "../../level-contracts.js";
import { getGroundSurfaceYAtX, getLevelGround, getLevelTerrain, sampleBoundaryPathSegments, sampleGroundPath } from "../../ground.js";

const { Bodies, Body, Engine, Events, Sleeping, World } = Matter;

export type CreateGameSessionInput = {
  levelData?: LevelData;
  birdPoolConfig?: BirdPoolLaunchConfig;
};

const normalizeSessionInput = (input?: CreateGameSessionInput | LevelData): CreateGameSessionInput => {
  if (input && "world" in input) {
    return { levelData: input };
  }

  return input ?? {};
};

// Game session
export const createGameSession = (input?: CreateGameSessionInput | LevelData): GameSession => {
  const sessionInput = normalizeSessionInput(input);
  const engine = Engine.create();
  const levelData = sessionInput.levelData ?? DEFAULT_LEVEL_DATA;
  const normalizedPool = normalizeBirdPool(levelData);
  const birdPoolConfig: BirdPoolLaunchConfig = sessionInput.birdPoolConfig ?? {
    totalBirds: normalizedPool.totalBirds,
    allowedBirdTypes: normalizedPool.allowedBirdTypes,
    caps: normalizedPool.caps,
    catalog: listSystemBirdDefinitions(),
  };
  const poolTracker = createBirdPoolTracker(birdPoolConfig);
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
        collisionFilter: {
          category: surfaceRole === "ground" ? COLLISION_CATEGORY_GROUND : COLLISION_CATEGORY_CEILING,
          mask: COLLISION_MASK_BOUNDARY,
        },
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

  applyBirdCollisionFilter(bird);
  Body.setStatic(bird, true);

  let awaitingBirdSelection = false;
  let birdReadyOnSlingshot = false;
  let activeBirdDefinition: BirdDefinition = DEFAULT_BIRD_DEFINITION;
  let shotBirdBodies: GameBody[] = [bird];

  const registerShotBird = (body: GameBody) => {
    if (!shotBirdBodies.includes(body)) {
      shotBirdBodies.push(body);
    }
  };

  const getActiveShotBirds = () => shotBirdBodies.filter((body) => !body.destroyed);

  const getSkillBird = () => {
    if (!bird.destroyed) {
      return bird;
    }

    return getActiveShotBirds()[0] ?? null;
  };

  const equipBird = (definition: BirdDefinition) => {
    activeBirdDefinition = definition;
    Body.setPosition(bird, { x: SLINGSHOT_X, y: SLINGSHOT_Y });
    Body.setStatic(bird, true);
    Body.setVelocity(bird, { x: 0, y: 0 });
    Body.setAngularVelocity(bird, 0);
    Body.setAngle(bird, 0);
    Sleeping.set(bird, false);
    attachGameEntity(bird, {
      kind: "bird",
      combatProfile: definition.combatProfile,
      birdType: definition.birdType,
      name: definition.name,
      fillColor: definition.fillColor,
    });
    applyCombatProfileToBird(bird, definition.combatProfile);
    applyBirdCollisionFilter(bird);
  };

  attachGameEntity(bird, {
    kind: "bird",
    combatProfile: DEFAULT_BIRD_DEFINITION.combatProfile,
    birdType: DEFAULT_BIRD_DEFINITION.birdType,
    name: "",
    fillColor: DEFAULT_BIRD_DEFINITION.fillColor,
  });

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

  const slingshotAnchor = {
    x: SLINGSHOT_X,
    y: SLINGSHOT_Y,
  };

  const getShotsRemaining = () => poolTracker.getShotsRemaining() - (birdLaunched ? 1 : 0);

  const getActiveBirdPresentation = () => {
    const entity = bird.plugin.gameEntity;
    if (entity?.kind === "bird" && birdReadyOnSlingshot) {
      return {
        activeBirdName: entity.name,
        activeBirdType: entity.birdType,
      };
    }

    return {
      activeBirdName: "",
      activeBirdType: "",
    };
  };

  const finishCurrentShot = () => {
    const entity = bird.plugin.gameEntity;
    const birdType = entity?.kind === "bird" ? entity.birdType : DEFAULT_BIRD_DEFINITION.birdType;
    poolTracker.consumeShot(birdType);
    birdLaunched = false;
    isDragging = false;
    settleTimeMs = 0;
    birdReadyOnSlingshot = false;
    skillEngine.clearShotState();
    shotBirdBodies = [bird];

    if (poolTracker.getShotsRemaining() > 0) {
      awaitingBirdSelection = true;
      Body.setPosition(bird, { x: SLINGSHOT_X, y: SLINGSHOT_Y });
      Body.setStatic(bird, true);
      Body.setVelocity(bird, { x: 0, y: 0 });
      Body.setAngularVelocity(bird, 0);
      status = "ready";
      return true;
    }

    return false;
  };

  const selectBird = (birdType: string) => {
    if (!worldPrimed || birdLaunched || !awaitingBirdSelection || !poolTracker.canSelect(birdType)) {
      return false;
    }

    const definition = birdPoolConfig.catalog.find((entry) => entry.birdType === birdType);
    if (!definition) {
      return false;
    }

    equipBird(definition);
    birdReadyOnSlingshot = true;
    awaitingBirdSelection = false;
    status = "ready";
    return true;
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

    wakeDependentBodies(body, bodies);

    const blockEntity = getBlockEntity(body);
    if (blockEntity) {
      blockEntity.state = "broken";
      blockEntity.pendingRemoval = false;
    }

    body.destroyed = true;
    World.remove(engine.world, body);
  };

  const addBody = (body: GameBody) => {
    if (body.destroyed) {
      return;
    }

    bodies.push(body);
    World.add(engine.world, body);
    if (!body.plugin.skillProjectile) {
      registerShotBird(body);
    }
  };

  const combatEffects = createCombatEffects({ removeBody });

  const skillEngine = createSkillEngine({
    getBird: getSkillBird,
    getBirdDefinition: () => activeBirdDefinition,
    getBodies: () => bodies,
    getNowMs: () => engine.timing.timestamp,
    isSkillAllowed: () => worldPrimed && birdLaunched && status === "running",
    combat: combatEffects,
    addBody,
    removeBody,
  });

  const combatResolver = createCombatResolver({
    removeBody,
    shouldApplyDamage: () => worldPrimed && birdLaunched,
    onStructureSupportLost: (body) => {
      releaseStructureSupport(body, bodies);
    },
  });

  // Collision event handlers
  const onCollisionStart = (event: IEventCollision<MatterEngine>) => {
    for (const pair of event.pairs) {
      const bodyA = pair.bodyA as GameBody;
      const bodyB = pair.bodyB as GameBody;

      if (!worldPrimed) {
        markSettlingSupport(bodyA, bodyB);
      } else {
        clearSupportCollapseOnContact(bodyA, bodyB);
      }
    }

    combatResolver.handleCollisionStart(event, engine.timing.timestamp);
  };

  const onCollisionActive = (event: IEventCollision<MatterEngine>) => {
    // 初始下落/落稳阶段交给 Matter 默认求解，自定义稳定化会把接触链瞬间“钉死”。
    if (!worldPrimed) {
      return;
    }

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

      if (isCrackingBlock(bodyA) || isCrackingBlock(bodyB)) {
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
      const stabilized = usesGroundSupportModel || usesBlockSupportModel || usesPigSupportModel;

      if (!stabilized) {
        applyRestingContactStabilization(bodyA, bodyB, pair.collision.normal);
        applyBeamSupportStabilization(bodyA, bodyB, pair.collision.normal);
        applyPigBeamStabilization(bodyA, bodyB, pair.collision.normal);
      }
    }
  };

  // Per-frame world update
  const onAfterUpdate = () => {
    updateDynamicCollisionFilters(bodies, { worldPrimed, birdLaunched });

    if (!worldPrimed) {
      keepBodiesAwakeDuringPriming(bodies);
    } else {
      manageBodySleep(bodies, bird, { birdLaunched, isDragging });
    }

    for (const body of bodies) {
      if (body.isStatic || body.destroyed) {
        continue;
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

      if (shotBirdBodies.includes(body) && body.position.y > height + 300) {
        removeBody(body);
        if (birdLaunched && getActiveShotBirds().length === 0) {
          if (finishCurrentShot()) {
            continue;
          }
          status = "lost";
        }
        continue;
      }

      if (body.position.y > height + 300) {
        removeBody(body);
      }
    }

    if (worldPrimed) {
      applyPenetrationCorrection(bodies);
    }

    skillEngine.tick(engine.timing.lastDelta);

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
          awaitingBirdSelection = true;
        }
      } else {
        initialSettleTimeMs = 0;
      }

      status = "ready";
      settleTimeMs = 0;
      return;
    }

    const livingPigs = bodies.filter((body) => body.renderKind === "pig" && !body.destroyed);
    const activeShotBirds = getActiveShotBirds();

    if (livingPigs.length === 0) {
      status = "won";
      return;
    }

    if (!birdLaunched) {
      status = isDragging ? "running" : "ready";
      settleTimeMs = 0;
      return;
    }

    if (!activeShotBirds.length) {
      status = "lost";
      return;
    }

    if (isSettled) {
      settleTimeMs += engine.timing.lastDelta;
      if (settleTimeMs >= SETTLE_TIME_MS) {
        if (livingPigs.length === 0) {
          status = "won";
          return;
        }

        if (finishCurrentShot()) {
          return;
        }

        status = "lost";
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
    birdsRemaining: getShotsRemaining(),
    shotsRemaining: getShotsRemaining(),
    awaitingBirdSelection,
    birdReadyOnSlingshot,
    selectableBirds: awaitingBirdSelection ? poolTracker.getSelectableBirds() : [],
    ...getActiveBirdPresentation(),
    skillVisuals: skillEngine.getVisuals(),
  });

  return {
    engine,
    getSnapshot,
    selectBird,
    beginDrag: (x, y) => {
      if (birdLaunched || !worldPrimed || !birdReadyOnSlingshot || awaitingBirdSelection) {
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
      shotBirdBodies = [bird];
      skillEngine.clearShotState();
      applyBirdCollisionFilter(bird);
      Body.setStatic(bird, false);
      Sleeping.set(bird, false);
      Body.setVelocity(bird, {
        x: (slingshotAnchor.x - bird.position.x) * LAUNCH_POWER,
        y: (slingshotAnchor.y - bird.position.y) * LAUNCH_POWER,
      });
    },
    activateSkill: () => skillEngine.activateSkill(),
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
