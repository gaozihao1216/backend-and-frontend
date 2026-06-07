import Matter from "matter-js";
import type { Body as MatterBody, Engine, IEventCollision, Vector as MatterVector } from "matter-js";

const { Bodies, Vector } = Matter;
import {
  BIRD_RADIUS,
  BLOCK_HEIGHT,
  BLOCK_WIDTH,
  GROUND_HEIGHT,
  GRAVITY_Y,
  LAUNCH_POWER,
  LEVEL_GRAVITY_REFERENCE,
  MAX_DRAG_DISTANCE,
  PIG_MAX_HEALTH,
  PIG_RADIUS,
  SETTLE_SPEED_THRESHOLD,
  SETTLE_TIME_MS,
  SLINGSHOT_X,
  SLINGSHOT_Y,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from "../constants.js";
import { createBlockDamageVisuals } from "../crack-generator.js";
import { DEFAULT_BLOCK_MATERIAL, MATERIAL_PARAMS } from "../materials.js";
import type { BlockGameEntity, GameBody, GameBodyKind, ObstacleMaterial } from "../types.js";
import type { LevelData, LevelEnemy, LevelObstacle } from "../../level-contracts.js";

// Physics tuning constants
export const PIG_DAMAGE_FACTOR = 3.6;
export const BLOCK_GROUND_DAMAGE_MULTIPLIER = 0.35;
export const PAIR_IMPACT_COOLDOWN_MS = 120;
export const FIXED_TIMESTEP_MS = 1000 / 60;
export const MAX_ACCUMULATED_TIME_MS = FIXED_TIMESTEP_MS * 3;
export const MAX_LINEAR_SPEED = 20;
export const MAX_BLOCK_LINEAR_SPEED = 16;
export const MAX_ANGULAR_SPEED = 0.22;
export const MAX_BEAM_ANGULAR_SPEED = 0.14;
export const BEAM_ANGULAR_DAMPING = 0.92;
export const MAX_POSITION_CORRECTION = 0.55;
export const PENETRATION_CORRECTION_MIN_OVERLAP = 1.25;
export const PENETRATION_CORRECTION_MAX_SPEED = 0.42;
export const BODY_SLEEP_LINEAR_THRESHOLD = 0.38;
export const BODY_SLEEP_ANGULAR_THRESHOLD = 0.09;

export const COLLISION_CATEGORY_GROUND = 0x0001;
export const COLLISION_CATEGORY_CEILING = 0x0002;
export const COLLISION_CATEGORY_DYNAMIC = 0x0004;
export const COLLISION_CATEGORY_BIRD = 0x0008;
export const COLLISION_MASK_FREE_FALL = COLLISION_CATEGORY_GROUND | COLLISION_CATEGORY_CEILING;
/** 同组下落物体互不碰撞；与边界、鸟、已落稳结构仍按 mask 碰撞 */
export const COLLISION_GROUP_FREE_FALL = -1;
export const COLLISION_MASK_DYNAMIC_FULL =
  COLLISION_MASK_FREE_FALL | COLLISION_CATEGORY_DYNAMIC | COLLISION_CATEGORY_BIRD;
export const COLLISION_MASK_BOUNDARY = COLLISION_MASK_DYNAMIC_FULL;

export const FREE_FALL_MAX_REST_SPEED = 0.14;
export const FREE_FALL_MAX_REST_ANGULAR = 0.055;
export const FREE_FALL_MIN_DOWNWARD = 0.06;
export const RESTING_CONTACT_NORMAL_SPEED_THRESHOLD = 0.28;
export const RESTING_CONTACT_TANGENTIAL_DAMPING = 0.9;
export const RESTING_CONTACT_ANGULAR_DAMPING = 0.84;
export const GROUND_CONTACT_NORMAL_SPEED_THRESHOLD = 0.42;
export const GROUND_CONTACT_MIN_DEPTH = 0.002;
export const GROUND_CONTACT_POINT_NORMAL_DAMPING = 0.24;
export const GROUND_CONTACT_POINT_TANGENTIAL_DAMPING = 0.08;
export const GROUND_CONTACT_POINT_MAX_NORMAL_SPEED_CORRECTION = 0.11;
export const GROUND_CONTACT_POINT_MAX_NORMAL_IMPULSE = 0.028;
export const GROUND_CONTACT_POINT_MAX_TANGENTIAL_IMPULSE_RATIO = 0.24;
export const GROUND_CONTACT_POST_ANGULAR_DAMPING = 0.997;
export const GROUND_CONTACT_MIN_SUPPORT_SPAN = 10;
export const BLOCK_SUPPORT_NORMAL_SPEED_THRESHOLD = 0.34;
export const BLOCK_SUPPORT_MIN_DEPTH = 0.003;
export const BLOCK_SUPPORT_DAMPING = 0.24;
export const BLOCK_SUPPORT_TANGENTIAL_DAMPING = 0.88;
export const BLOCK_SUPPORT_MAX_NORMAL_RESPONSE = 0.44;
export const BLOCK_SUPPORT_ANGULAR_DAMPING = 0.92;
export const PIG_SUPPORT_NORMAL_SPEED_THRESHOLD = 0.48;
export const PIG_SUPPORT_MIN_DEPTH = 0.002;
export const PIG_SUPPORT_DAMPING = 0.28;
export const PIG_SUPPORT_TANGENTIAL_DAMPING = 0.76;
export const PIG_SUPPORT_MAX_NORMAL_RESPONSE = 0.4;
export const PIG_SUPPORT_ANGULAR_DAMPING = 0.68;
export const PIG_SUPPORT_COUNTERPART_ANGULAR_DAMPING = 0.94;
export const BEAM_SUPPORT_NORMAL_ALIGNMENT_THRESHOLD = 0.58;
export const BEAM_SUPPORT_MAX_ANGLE = 0.42;
export const BEAM_SUPPORT_TANGENT_DAMPING = 0.72;
export const BEAM_SUPPORT_SUPPORT_DAMPING = 0.82;
export const PIG_BEAM_CONTACT_MAX_ANGLE = 0.48;
export const PIG_BEAM_RELATIVE_TANGENT_THRESHOLD = 1.2;
export const PIG_BEAM_TANGENT_DAMPING = 0.68;
export const PIG_BEAM_ANGULAR_DAMPING = 0.72;
export const PIG_BEAM_ROLLING_SPEED_THRESHOLD = 0.42;
export const PIG_BEAM_ROLLING_RESISTANCE = 0.58;
export const PIG_BEAM_ROTATION_TO_TRANSLATION_DAMPING = 0.38;

// Re-export shared gameplay constants used by the session orchestrator.
export {
  BIRD_RADIUS,
  BLOCK_HEIGHT,
  BLOCK_WIDTH,
  GROUND_HEIGHT,
  GRAVITY_Y,
  LAUNCH_POWER,
  LEVEL_GRAVITY_REFERENCE,
  MAX_DRAG_DISTANCE,
  PIG_RADIUS,
  SETTLE_SPEED_THRESHOLD,
  SETTLE_TIME_MS,
  SLINGSHOT_X,
  SLINGSHOT_Y,
  WORLD_HEIGHT,
  WORLD_WIDTH,
};

// Body/entity helpers
export const setRenderKind = (body: MatterBody, kind: GameBodyKind): GameBody => {
  const gameBody = body as GameBody;
  gameBody.renderKind = kind;
  return gameBody;
};

export const attachGameEntity = <T extends GameBody["plugin"]["gameEntity"]>(body: GameBody, gameEntity: T) => {
  body.plugin = {
    ...body.plugin,
    gameEntity,
  };
  return body;
};

export const applyHealth = (body: GameBody, maxHealth: number): GameBody => {
  body.maxHealth = maxHealth;
  body.health = maxHealth;
  body.destroyed = false;
  return body;
};

export const createBlockEntity = (material: ObstacleMaterial): BlockGameEntity => ({
  kind: "block",
  material,
  hp: MATERIAL_PARAMS[material].maxHp,
  maxHp: MATERIAL_PARAMS[material].maxHp,
  state: "intact",
  crackStartTime: null,
  breakDuration: 0,
  effectiveThickness: 0,
  pendingRemoval: false,
  collisionCooldownUntil: 0,
});

export const getBlockEntity = (body: GameBody): BlockGameEntity | null => {
  const entity = body.plugin.gameEntity as GameBody["plugin"]["gameEntity"];
  return entity?.kind === "block" ? entity : null;
};

export const updateDamageVisuals = (body: GameBody) => {
  const entity = getBlockEntity(body);
  if (!entity) {
    return;
  }

  const width = body.renderWidth ?? body.bounds.max.x - body.bounds.min.x;
  const height = body.renderHeight ?? body.bounds.max.y - body.bounds.min.y;
  const damageRatio = 1 - entity.hp / entity.maxHp;
  const seedSource = Math.round(body.position.x * 13 + body.position.y * 17 + width * 19 + height * 23);

  body.damageVisuals = createBlockDamageVisuals(width, height, damageRatio, seedSource);
};

// Default level bootstrap
export const DEFAULT_LEVEL_DATA: LevelData = {
  world: {
    width: WORLD_WIDTH,
    height: WORLD_HEIGHT,
    gravity: LEVEL_GRAVITY_REFERENCE,
  },
  ground: {
    type: "line",
    points: [
      { x: 0, y: WORLD_HEIGHT - GROUND_HEIGHT },
      { x: WORLD_WIDTH / 2, y: WORLD_HEIGHT - GROUND_HEIGHT },
      { x: WORLD_WIDTH, y: WORLD_HEIGHT - GROUND_HEIGHT },
    ],
  },
  birdInventory: {
    basic: 1,
  },
  obstacles: [
    {
      id: "default-block",
      material: DEFAULT_BLOCK_MATERIAL,
      position: {
        x: WORLD_WIDTH * 0.68,
        y: WORLD_HEIGHT - GROUND_HEIGHT - BLOCK_HEIGHT / 2,
      },
      size: {
        width: BLOCK_WIDTH,
        height: BLOCK_HEIGHT,
      },
    },
  ],
  enemies: [
    {
      id: "default-pig",
      type: "pig",
      position: {
        x: WORLD_WIDTH * 0.68,
        y: WORLD_HEIGHT - GROUND_HEIGHT - BLOCK_HEIGHT - PIG_RADIUS,
      },
      size: {
        width: PIG_RADIUS * 2,
        height: PIG_RADIUS * 2,
      },
    },
  ],
};

// Geometry and contact helpers
export const scaleX = (x: number, levelData: LevelData) => (x / levelData.world.width) * WORLD_WIDTH;
export const scaleY = (y: number, levelData: LevelData) => (y / levelData.world.height) * WORLD_HEIGHT;

export const getObstacleAspectRatio = (width: number, height: number) =>
  Math.max(width, height) / Math.max(1, Math.min(width, height));

export const isHorizontalBeamBody = (body: GameBody) =>
  body.renderKind === "block"
  && body.renderWidth !== undefined
  && body.renderHeight !== undefined
  && getObstacleAspectRatio(body.renderWidth, body.renderHeight) >= 3
  && body.renderWidth >= body.renderHeight;

export const isStableBeamCandidate = (body: GameBody) =>
  isHorizontalBeamBody(body)
  && Math.abs(body.angle) <= BEAM_SUPPORT_MAX_ANGLE
  && body.speed <= 1.2;

export const isPigBeamCandidate = (body: GameBody) =>
  isHorizontalBeamBody(body)
  && Math.abs(body.angle) <= PIG_BEAM_CONTACT_MAX_ANGLE;

export const cross2D = (a: MatterVector, b: MatterVector) => a.x * b.y - a.y * b.x;

export const velocityAtPoint = (body: GameBody, offset: MatterVector) => ({
  x: body.velocity.x - body.angularVelocity * offset.y,
  y: body.velocity.y + body.angularVelocity * offset.x,
});

export const getPairContactPoint = (
  pair: IEventCollision<Engine>["pairs"][number],
  fallbackBody: GameBody,
  normal: MatterVector,
) => {
  const contacts = pair.activeContacts ?? [];
  if (contacts.length > 0) {
    // Matter 可能给出多个接触点，这里取平均点作为“接触中心”近似。
    const summed = contacts.reduce(
      (accumulator, contact) => ({
        x: accumulator.x + contact.vertex.x,
        y: accumulator.y + contact.vertex.y,
      }),
      { x: 0, y: 0 },
    );

    return {
      x: summed.x / contacts.length,
      y: summed.y / contacts.length,
    };
  }

  // 没有可用接触点时，退化为沿法向从质心投到底面的近似点。
  const fallbackExtent = Math.max(
    0,
    Math.min(
      fallbackBody.bounds.max.y - fallbackBody.position.y,
      fallbackBody.position.y - fallbackBody.bounds.min.y,
    ),
  );

  return Vector.sub(fallbackBody.position, Vector.mult(normal, fallbackExtent));
};

export const getPairContactSpan = (pair: IEventCollision<Engine>["pairs"][number], tangent: MatterVector) => {
  const contacts = pair.activeContacts ?? [];
  if (contacts.length < 2) {
    return 0;
  }

  // 在切向上的跨度可用来区分“面支撑”与“单角接触”。
  let minProjection = Infinity;
  let maxProjection = -Infinity;
  for (const contact of contacts) {
    const projection = Vector.dot(contact.vertex, tangent);
    minProjection = Math.min(minProjection, projection);
    maxProjection = Math.max(maxProjection, projection);
  }

  return Math.max(0, maxProjection - minProjection);
};

// Body construction
const getObstaclePhysics = (
  material: ObstacleMaterial,
  renderWidth: number,
  renderHeight: number,
) => {
  const aspectRatio = getObstacleAspectRatio(renderWidth, renderHeight);
  const isBeam = aspectRatio >= 3;
  const isHorizontalBeam = isBeam && renderWidth >= renderHeight;
  const isVerticalSupport = aspectRatio >= 2.2 && renderHeight > renderWidth;

  switch (material) {
    case "glass":
      return {
        restitution: 0,
        friction: isHorizontalBeam ? 0.48 : 0.4,
        frictionStatic: isHorizontalBeam ? 0.58 : 0.5,
        frictionAir: isHorizontalBeam ? 0.028 : 0.022,
        density: isVerticalSupport ? 0.0018 : 0.00145,
        isBeam,
        isHorizontalBeam,
        isVerticalSupport,
      };
    case "stone":
      return {
        restitution: 0,
        friction: isVerticalSupport ? 1.55 : isHorizontalBeam ? 1.35 : 1.25,
        frictionStatic: isVerticalSupport ? 1.85 : isHorizontalBeam ? 1.55 : 1.45,
        frictionAir: isHorizontalBeam ? 0.05 : 0.034,
        density: isVerticalSupport ? 0.0066 : isHorizontalBeam ? 0.0037 : 0.005,
        isBeam,
        isHorizontalBeam,
        isVerticalSupport,
      };
    case "wood":
    default:
      return {
        restitution: 0,
        friction: isVerticalSupport ? 1.45 : isHorizontalBeam ? 1.25 : 1.1,
        frictionStatic: isVerticalSupport ? 1.75 : isHorizontalBeam ? 1.45 : 1.3,
        frictionAir: isHorizontalBeam ? 0.048 : 0.03,
        density: isVerticalSupport ? 0.0039 : isHorizontalBeam ? 0.00155 : 0.0025,
        isBeam,
        isHorizontalBeam,
        isVerticalSupport,
      };
  }
};

export const createObstacleBody = (obstacle: LevelObstacle, levelData: LevelData) => {
  const renderWidth = (obstacle.size.width / levelData.world.width) * WORLD_WIDTH;
  const renderHeight = (obstacle.size.height / levelData.world.height) * WORLD_HEIGHT;
  const width = renderWidth;
  const height = renderHeight;
  const physics = getObstaclePhysics(obstacle.material, renderWidth, renderHeight);
  // 这里把关卡中的相对尺寸映射到实际渲染/物理尺寸，并附带材质参数。
  const block = setRenderKind(
    Bodies.rectangle(scaleX(obstacle.position.x, levelData), scaleY(obstacle.position.y, levelData), width, height, {
      angle: obstacle.angle ?? 0,
      restitution: physics.restitution,
      friction: physics.friction,
      frictionStatic: physics.frictionStatic,
      frictionAir: physics.frictionAir,
      density: physics.density,
      slop: 0.014,
      collisionFilter: {
        group: COLLISION_GROUP_FREE_FALL,
        category: COLLISION_CATEGORY_DYNAMIC,
        mask: COLLISION_MASK_DYNAMIC_FULL,
      },
    }),
    "block",
  );
  block.renderWidth = renderWidth;
  block.renderHeight = renderHeight;
  block.sleepThreshold = physics.isVerticalSupport ? 30 : physics.isHorizontalBeam ? 24 : physics.isBeam ? 34 : 42;
  attachGameEntity(block, createBlockEntity(obstacle.material));
  updateDamageVisuals(block);
  return block;
};

export const createEnemyBody = (enemy: LevelEnemy, levelData: LevelData) => {
  const renderWidth = ((enemy.size?.width ?? PIG_RADIUS * 2) / levelData.world.width) * WORLD_WIDTH;
  const renderHeight = ((enemy.size?.height ?? PIG_RADIUS * 2) / levelData.world.height) * WORLD_HEIGHT;
  const enemyRadius = Math.min(renderWidth, renderHeight) / 2;
  const pig = setRenderKind(
    Bodies.circle(scaleX(enemy.position.x, levelData), scaleY(enemy.position.y, levelData), enemyRadius, {
      restitution: 0,
      friction: 0.82,
      frictionStatic: 0.98,
      frictionAir: 0.02,
      density: 0.0015,
      slop: 0.01,
      collisionFilter: {
        group: COLLISION_GROUP_FREE_FALL,
        category: COLLISION_CATEGORY_DYNAMIC,
        mask: COLLISION_MASK_DYNAMIC_FULL,
      },
    }),
    "pig",
  );
  applyHealth(pig, PIG_MAX_HEALTH);
  attachGameEntity(pig, { kind: "pig" });
  return pig;
};
