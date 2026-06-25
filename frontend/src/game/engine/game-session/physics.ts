import Matter from "matter-js";
import type { Engine, IEventCollision, Vector as MatterVector } from "matter-js";
import type { GameBody } from "../core/types.js";
import {
  BEAM_SUPPORT_MAX_ANGLE,
  BEAM_SUPPORT_NORMAL_ALIGNMENT_THRESHOLD,
  BEAM_SUPPORT_SUPPORT_DAMPING,
  BEAM_SUPPORT_TANGENT_DAMPING,
  BLOCK_SUPPORT_ANGULAR_DAMPING,
  BLOCK_SUPPORT_DAMPING,
  BLOCK_SUPPORT_MAX_NORMAL_RESPONSE,
  BLOCK_SUPPORT_MIN_DEPTH,
  BLOCK_SUPPORT_NORMAL_SPEED_THRESHOLD,
  BLOCK_SUPPORT_TANGENTIAL_DAMPING,
  BODY_SLEEP_ANGULAR_THRESHOLD,
  BODY_SLEEP_LINEAR_THRESHOLD,
  COLLISION_CATEGORY_BIRD,
  COLLISION_CATEGORY_CEILING,
  COLLISION_CATEGORY_DYNAMIC,
  COLLISION_CATEGORY_GROUND,
  COLLISION_GROUP_FREE_FALL,
  COLLISION_MASK_BOUNDARY,
  COLLISION_MASK_DYNAMIC_FULL,
  COLLISION_MASK_FREE_FALL,
  FREE_FALL_MAX_REST_ANGULAR,
  FREE_FALL_MAX_REST_SPEED,
  FREE_FALL_MIN_DOWNWARD,
  GROUND_CONTACT_MIN_DEPTH,
  GROUND_CONTACT_MIN_SUPPORT_SPAN,
  GROUND_CONTACT_NORMAL_SPEED_THRESHOLD,
  GROUND_CONTACT_POINT_MAX_NORMAL_IMPULSE,
  GROUND_CONTACT_POINT_MAX_NORMAL_SPEED_CORRECTION,
  GROUND_CONTACT_POINT_MAX_TANGENTIAL_IMPULSE_RATIO,
  GROUND_CONTACT_POINT_NORMAL_DAMPING,
  GROUND_CONTACT_POINT_TANGENTIAL_DAMPING,
  GROUND_CONTACT_POST_ANGULAR_DAMPING,
  PENETRATION_CORRECTION_MAX_SPEED,
  PENETRATION_CORRECTION_MIN_OVERLAP,
  PENETRATION_CORRECTION_DYNAMIC_MAX_SPEED,
  RESTING_MICRO_SPEED,
  RESTING_SNAP_SPEED,
  MAX_ANGULAR_SPEED,
  MAX_BEAM_ANGULAR_SPEED,
  MAX_BLOCK_LINEAR_SPEED,
  MAX_LINEAR_SPEED,
  MAX_POSITION_CORRECTION,
  PIG_BEAM_ANGULAR_DAMPING,
  PIG_BEAM_CONTACT_MAX_ANGLE,
  PIG_BEAM_RELATIVE_TANGENT_THRESHOLD,
  PIG_BEAM_ROLLING_RESISTANCE,
  PIG_BEAM_ROLLING_SPEED_THRESHOLD,
  PIG_BEAM_ROTATION_TO_TRANSLATION_DAMPING,
  PIG_BEAM_TANGENT_DAMPING,
  PIG_SUPPORT_ANGULAR_DAMPING,
  PIG_SUPPORT_COUNTERPART_ANGULAR_DAMPING,
  PIG_SUPPORT_DAMPING,
  PIG_SUPPORT_MAX_NORMAL_RESPONSE,
  PIG_SUPPORT_MIN_DEPTH,
  PIG_SUPPORT_MICRO_NORMAL_SPEED_THRESHOLD,
  PIG_SUPPORT_NORMAL_SPEED_THRESHOLD,
  PIG_SUPPORT_TANGENTIAL_DAMPING,
  RESTING_CONTACT_ANGULAR_DAMPING,
  RESTING_CONTACT_MICRO_SPEED_THRESHOLD,
  RESTING_CONTACT_NORMAL_SPEED_THRESHOLD,
  RESTING_CONTACT_MICRO_TANGENTIAL_DAMPING,
  RESTING_CONTACT_TANGENTIAL_DAMPING,
  BLOCK_SUPPORT_MICRO_NORMAL_SPEED_THRESHOLD,
  BEAM_ANGULAR_DAMPING,
  cross2D,
  getObstacleAspectRatio,
  getPairContactPoint,
  getPairContactSpan,
  isHorizontalBeamBody,
  isPigBeamCandidate,
  isStableBeamCandidate,
  velocityAtPoint,
  getBlockEntity,
} from "./config.js";

const { Body, Sleeping, Vector } = Matter;

const shouldKeepBodyAwake = (
  body: GameBody,
  bird: GameBody,
  options: { birdLaunched: boolean; isDragging: boolean },
) => {
  if (body === bird) {
    return options.isDragging || !options.birdLaunched || body.speed > 0.45;
  }

  const blockEntity = getBlockEntity(body);
  if (blockEntity?.state === "cracking") {
    return true;
  }

  if (body.plugin.supportCollapse) {
    return true;
  }

  return body.speed > BODY_SLEEP_LINEAR_THRESHOLD || Math.abs(body.angularVelocity) > BODY_SLEEP_ANGULAR_THRESHOLD;
};

export const manageBodySleep = (
  bodies: GameBody[],
  bird: GameBody,
  options: { birdLaunched: boolean; isDragging: boolean },
) => {
  for (const body of bodies) {
    if (body.isStatic || body.destroyed || !body.isSleeping) {
      continue;
    }

    if (shouldKeepBodyAwake(body, bird, options)) {
      Sleeping.set(body, false);
    }
  }
};

export const keepBodiesAwakeDuringPriming = (bodies: GameBody[]) => {
  for (const body of bodies) {
    if (body.isStatic || body.destroyed || !body.isSleeping) {
      continue;
    }

    Sleeping.set(body, false);
  }
};

export const isInFreeFall = (body: GameBody) => {
  if (body.isStatic || body.destroyed || body.renderKind === "bird") {
    return false;
  }

  if (body.plugin.physicsSettling?.supported) {
    return false;
  }

  if (body.speed <= FREE_FALL_MAX_REST_SPEED && Math.abs(body.angularVelocity) <= FREE_FALL_MAX_REST_ANGULAR) {
    return false;
  }

  return body.velocity.y >= FREE_FALL_MIN_DOWNWARD || body.speed >= FREE_FALL_MAX_REST_SPEED;
};

const markBodySupported = (body: GameBody) => {
  if (body.isStatic || body.destroyed || body.renderKind === "bird" || body.renderKind === "ground") {
    return;
  }

  body.plugin.physicsSettling = { supported: true };
};

/** 初始落稳阶段：触地或被已支撑结构托住后，立即切换为可承载碰撞体 */
export const markSettlingSupport = (bodyA: GameBody, bodyB: GameBody) => {
  if (bodyA.renderKind === "ground") {
    markBodySupported(bodyB);
    return;
  }

  if (bodyB.renderKind === "ground") {
    markBodySupported(bodyA);
    return;
  }

  const dynamicA = bodyA.renderKind === "block" || bodyA.renderKind === "pig";
  const dynamicB = bodyB.renderKind === "block" || bodyB.renderKind === "pig";
  if (!dynamicA || !dynamicB) {
    return;
  }

  if (bodyA.plugin.physicsSettling?.supported) {
    markBodySupported(bodyB);
  }

  if (bodyB.plugin.physicsSettling?.supported) {
    markBodySupported(bodyA);
  }
};

const horizontalOverlapAmount = (bodyA: GameBody, bodyB: GameBody) =>
  Math.min(bodyA.bounds.max.x, bodyB.bounds.max.x) - Math.max(bodyA.bounds.min.x, bodyB.bounds.min.x);

const FOOT_SUPPORT_TOLERANCE = 16;
const GROUND_PENETRATION_TOLERANCE = 0.75;

export const isCrackingBlock = (body: GameBody) => getBlockEntity(body)?.state === "cracking";

const isSupportCandidate = (body: GameBody) =>
  !body.destroyed
  && !body.isSensor
  && (body.renderKind === "ground" || body.renderKind === "block" || body.renderKind === "pig" || body.renderKind === "bird")
  && !isCrackingBlock(body);

const isPenetratingGround = (body: GameBody, bodies: GameBody[]) => {
  const footY = body.bounds.max.y;

  for (const ground of bodies) {
    if (ground.renderKind !== "ground" || ground.destroyed) {
      continue;
    }

    if (horizontalOverlapAmount(body, ground) <= 0) {
      continue;
    }

    if (footY - ground.bounds.min.y > GROUND_PENETRATION_TOLERANCE) {
      return true;
    }
  }

  return false;
};

/** 检测物体下方是否仍有可承载的地面/结构（碎裂中的方块不算支撑） */
export const hasPhysicalSupportBelow = (body: GameBody, bodies: GameBody[]) => {
  if (body.destroyed || body.isStatic) {
    return true;
  }

  if (isPenetratingGround(body, bodies)) {
    return false;
  }

  if (body.plugin.birdSupportFrom !== undefined) {
    const supportingBird = bodies.find(
      (candidate) => candidate.id === body.plugin.birdSupportFrom && !candidate.destroyed && candidate.renderKind === "bird",
    );
    if (
      supportingBird
      && horizontalOverlapAmount(body, supportingBird) > 0
      && body.bounds.max.y >= supportingBird.bounds.min.y - FOOT_SUPPORT_TOLERANCE
    ) {
      return true;
    }

    delete body.plugin.birdSupportFrom;
  }

  const footY = body.bounds.max.y;

  for (const candidate of bodies) {
    if (candidate === body || !isSupportCandidate(candidate)) {
      continue;
    }

    if (horizontalOverlapAmount(body, candidate) <= 0) {
      continue;
    }

    const supportTop = candidate.bounds.min.y;

    if (candidate.renderKind === "ground" || candidate.renderKind === "bird") {
      if (Math.abs(footY - supportTop) <= FOOT_SUPPORT_TOLERANCE) {
        return true;
      }
      continue;
    }

    if (Math.abs(footY - supportTop) <= FOOT_SUPPORT_TOLERANCE) {
      return true;
    }

    if (footY >= supportTop - 4 && footY <= supportTop + 6 && body.bounds.min.y < supportTop) {
      return true;
    }
  }

  return false;
};

const wakeBodyForCollapse = (body: GameBody) => {
  const alreadyCollapsing = Boolean(body.plugin.supportCollapse);
  Sleeping.set(body, false);
  delete body.plugin.physicsSettling;
  body.plugin.supportCollapse = true;

  if (!alreadyCollapsing && body.velocity.y < 1) {
    Body.setVelocity(body, {
      x: body.velocity.x,
      y: Math.max(body.velocity.y, 1.2),
    });
  }
};

/** 每帧检测悬空结构并强制进入坍塌态，保证多层连锁 */
export const enforceStructureSupport = (bodies: GameBody[]) => {
  for (const body of bodies) {
    if (
      body.destroyed
      || body.isStatic
      || body.renderKind === "bird"
      || body.renderKind === "ground"
      || (body.renderKind !== "block" && body.renderKind !== "pig")
      || isCrackingBlock(body)
    ) {
      continue;
    }

    if (hasPhysicalSupportBelow(body, bodies)) {
      if (
        body.plugin.supportCollapse
        && body.speed < 0.25
        && Math.abs(body.angularVelocity) < 0.06
      ) {
        delete body.plugin.supportCollapse;
      }
      continue;
    }

    wakeBodyForCollapse(body);
  }
};

/** 支撑体失效后，唤醒其上方/与之接触的结构，避免睡眠体悬空或钉死 */
export const wakeDependentBodies = (supportBody: GameBody, bodies: GameBody[]) => {
  const supportBounds = supportBody.bounds;

  for (const body of bodies) {
    if (
      body === supportBody
      || body.destroyed
      || body.isStatic
      || body.renderKind === "ground"
      || body.renderKind === "bird"
    ) {
      continue;
    }

    if (supportBody.renderKind === "bird") {
      if (horizontalOverlapAmount(body, supportBody) > 0 && body.bounds.max.y >= supportBounds.min.y - 14) {
        wakeBodyForCollapse(body);
      }
      continue;
    }

    if (horizontalOverlapAmount(body, supportBody) <= 0) {
      continue;
    }

    const restingOnSupport =
      body.bounds.max.y >= supportBounds.min.y - 12
      && body.bounds.min.y <= supportBounds.min.y + 8;
    const stackedAbove =
      body.bounds.min.y < supportBounds.min.y
      && body.bounds.max.y >= supportBounds.min.y - 16;

    if (!restingOnSupport && !stackedAbove) {
      continue;
    }

    wakeBodyForCollapse(body);
  }
};

/** 已获支撑且低速的结构：消掉挤压/contact 求解留下的微振 */
export const dampSupportedRestingMotion = (bodies: GameBody[]) => {
  for (const body of bodies) {
    if (
      body.destroyed
      || body.isStatic
      || body.renderKind === "bird"
      || body.renderKind === "ground"
      || body.plugin.supportCollapse
      || isCrackingBlock(body)
    ) {
      continue;
    }

    if (!hasPhysicalSupportBelow(body, bodies)) {
      continue;
    }

    if (isPenetratingGround(body, bodies)) {
      continue;
    }

    const angularSpeed = Math.abs(body.angularVelocity);
    if (body.speed < RESTING_MICRO_SPEED) {
      Body.setVelocity(body, {
        x: body.velocity.x * 0.62,
        y: body.velocity.y * 0.62,
      });
    }

    if (body.speed < RESTING_SNAP_SPEED && angularSpeed < 0.035) {
      Body.setVelocity(body, { x: 0, y: 0 });
      Body.setAngularVelocity(body, 0);
    } else if (angularSpeed < 0.02) {
      Body.setAngularVelocity(body, 0);
    }
  }
};

/** 将陷入地面的动态体抬回地表，避免 resting 阻尼把物体“钉”进地里 */
export const correctGroundPenetration = (bodies: GameBody[]) => {
  for (const body of bodies) {
    if (
      body.destroyed
      || body.isStatic
      || body.renderKind === "bird"
      || body.renderKind === "ground"
    ) {
      continue;
    }

    const footY = body.bounds.max.y;

    for (const ground of bodies) {
      if (ground.renderKind !== "ground" || ground.destroyed) {
        continue;
      }

      if (horizontalOverlapAmount(body, ground) <= 0) {
        continue;
      }

      const groundTop = ground.bounds.min.y;
      const penetration = footY - groundTop;
      if (penetration <= GROUND_PENETRATION_TOLERANCE) {
        continue;
      }

      const correction = Math.min(MAX_POSITION_CORRECTION, penetration * 0.65);
      Body.setPosition(body, {
        x: body.position.x,
        y: body.position.y - correction,
      });

      if (body.velocity.y > 0) {
        Body.setVelocity(body, {
          x: body.velocity.x,
          y: Math.min(body.velocity.y, 0),
        });
      }

      Sleeping.set(body, false);
    }
  }
};

/** 记录与鸟体接触、由鸟承担支撑的结构 */
export const markBirdContactSupport = (bodyA: GameBody, bodyB: GameBody) => {
  for (const [bird, other] of [[bodyA, bodyB], [bodyB, bodyA]] as const) {
    if (bird.renderKind !== "bird" || bird.destroyed) {
      continue;
    }

    if (other.renderKind === "bird" || other.renderKind === "ground" || other.destroyed) {
      continue;
    }

    if (horizontalOverlapAmount(bird, other) <= 0) {
      continue;
    }

    const birdTop = bird.bounds.min.y;
    const otherFoot = other.bounds.max.y;
    if (otherFoot >= birdTop - 12 && other.bounds.min.y <= bird.bounds.max.y + 6) {
      other.plugin.birdSupportFrom = bird.id;
    }
  }
};

/** 鸟体移除：释放其承担的一切接触支撑并触发连锁坍塌 */
export const releaseBirdContactSupport = (bird: GameBody, bodies: GameBody[]) => {
  if (bird.renderKind !== "bird" || bird.destroyed) {
    return;
  }

  for (const body of bodies) {
    if (body === bird || body.destroyed || body.isStatic || body.renderKind === "bird" || body.renderKind === "ground") {
      continue;
    }

    if (body.plugin.birdSupportFrom === bird.id) {
      delete body.plugin.birdSupportFrom;
      wakeBodyForCollapse(body);
    }
  }

  wakeDependentBodies(bird, bodies);

  for (const body of bodies) {
    if (body === bird || body.destroyed || body.isStatic || body.renderKind === "bird" || body.renderKind === "ground") {
      continue;
    }

    const overlapX = horizontalOverlapAmount(body, bird);
    const overlapY = Math.min(body.bounds.max.y, bird.bounds.max.y) - Math.max(body.bounds.min.y, bird.bounds.min.y);
    if (overlapX > 0 && overlapY > 0) {
      wakeBodyForCollapse(body);
    }
  }
};

export const clearSupportCollapseOnContact = (bodyA: GameBody, bodyB: GameBody) => {
  for (const [body, other] of [[bodyA, bodyB], [bodyB, bodyA]] as const) {
    if (!body.plugin.supportCollapse || body.destroyed) {
      continue;
    }

    if (other.renderKind === "ground") {
      delete body.plugin.supportCollapse;
      continue;
    }

    if (other.renderKind === "bird") {
      continue;
    }

    if (!isSupportCandidate(other)) {
      continue;
    }

    const overlapX = horizontalOverlapAmount(body, other);
    if (overlapX <= 0) {
      continue;
    }

    const footY = body.bounds.max.y;
    const supportTop = other.bounds.min.y;
    if (Math.abs(footY - supportTop) <= FOOT_SUPPORT_TOLERANCE) {
      delete body.plugin.supportCollapse;
    }
  }
};

/** 方块开始碎裂或即将移除：释放对其上方结构的支撑，触发连锁坍塌 */
export const releaseStructureSupport = (supportBody: GameBody, bodies: GameBody[]) => {
  if (supportBody.destroyed || supportBody.isStatic) {
    return;
  }

  wakeDependentBodies(supportBody, bodies);

  if (isCrackingBlock(supportBody)) {
    Sleeping.set(supportBody, false);
    Body.set(supportBody, {
      isSensor: true,
      collisionFilter: {
        group: 0,
        category: COLLISION_CATEGORY_DYNAMIC,
        mask: 0,
      },
    });
  }
};

const applyDynamicCollisionFilter = (body: GameBody, freeFall: boolean) => {
  Body.set(body, {
    collisionFilter: {
      group: freeFall ? COLLISION_GROUP_FREE_FALL : 0,
      category: COLLISION_CATEGORY_DYNAMIC,
      mask: COLLISION_MASK_DYNAMIC_FULL,
    },
  });
};

export const applyBirdCollisionFilter = (body: GameBody) => {
  Body.set(body, {
    collisionFilter: {
      group: 0,
      category: COLLISION_CATEGORY_BIRD,
      mask: COLLISION_MASK_DYNAMIC_FULL,
    },
  });
};

export const updateDynamicCollisionFilters = (
  bodies: GameBody[],
  options: { worldPrimed: boolean; birdLaunched: boolean },
) => {
  if (options.worldPrimed || options.birdLaunched) {
    for (const body of bodies) {
      if (body.destroyed || body.isStatic || body.renderKind === "bird") {
        continue;
      }

      if (body.renderKind === "block" || body.renderKind === "pig") {
        applyDynamicCollisionFilter(body, false);
      }
    }
    return;
  }

  for (const body of bodies) {
    if (body.destroyed || body.isStatic || body.renderKind === "bird") {
      continue;
    }

    if (body.renderKind === "block" || body.renderKind === "pig") {
      applyDynamicCollisionFilter(body, isInFreeFall(body));
    }
  }
};

export const clampBodyVelocity = (body: GameBody) => {
  if (body.isStatic || body.destroyed) {
    return;
  }

  // 这里的限速是数值稳定措施，不是游戏规则层面的“最高速度”设计。
  const maxSpeed = body.renderKind === "bird" ? MAX_LINEAR_SPEED : MAX_BLOCK_LINEAR_SPEED;
  if (body.speed > maxSpeed) {
    const scale = maxSpeed / body.speed;
    Body.setVelocity(body, {
      x: body.velocity.x * scale,
      y: body.velocity.y * scale,
    });
  }

  const aspectRatio =
    body.renderKind === "block" && body.renderWidth && body.renderHeight
      ? getObstacleAspectRatio(body.renderWidth, body.renderHeight)
      : 1;
  const isHorizontalBeam = isHorizontalBeamBody(body);
  const maxAngularSpeed = aspectRatio >= 3 ? MAX_BEAM_ANGULAR_SPEED : MAX_ANGULAR_SPEED;
  if (isHorizontalBeam && Math.abs(body.angularVelocity) > 0.01) {
    Body.setAngularVelocity(body, body.angularVelocity * BEAM_ANGULAR_DAMPING);
  }
  if (Math.abs(body.angularVelocity) > maxAngularSpeed) {
    Body.setAngularVelocity(body, Math.sign(body.angularVelocity) * maxAngularSpeed);
  }
};

export const applyPenetrationCorrection = (bodies: GameBody[]) => {
  const activeBodies = bodies.filter((body) => !body.destroyed && !body.isStatic);

  for (let index = 0; index < activeBodies.length; index += 1) {
    const bodyA = activeBodies[index];
    if (!bodyA || bodyA.plugin.supportCollapse) {
      continue;
    }

    for (let otherIndex = index + 1; otherIndex < bodies.length; otherIndex += 1) {
      const bodyB = bodies[otherIndex];
      if (!bodyB || bodyB.destroyed || bodyB.isStatic || bodyB.plugin.supportCollapse) {
        continue;
      }

      if (bodyA.speed > PENETRATION_CORRECTION_MAX_SPEED || bodyB.speed > PENETRATION_CORRECTION_MAX_SPEED) {
        continue;
      }

      const bothDynamic =
        !bodyA.isStatic
        && !bodyB.isStatic
        && bodyA.renderKind !== "bird"
        && bodyB.renderKind !== "bird";
      if (bothDynamic && Math.max(bodyA.speed, bodyB.speed) < PENETRATION_CORRECTION_DYNAMIC_MAX_SPEED) {
        continue;
      }

      const overlapX = Math.min(bodyA.bounds.max.x, bodyB.bounds.max.x) - Math.max(bodyA.bounds.min.x, bodyB.bounds.min.x);
      const overlapY = Math.min(bodyA.bounds.max.y, bodyB.bounds.max.y) - Math.max(bodyA.bounds.min.y, bodyB.bounds.min.y);
      if (overlapX <= 0 || overlapY <= 0) {
        continue;
      }

      const overlapAmount = Math.min(overlapX, overlapY);
      if (overlapAmount < PENETRATION_CORRECTION_MIN_OVERLAP) {
        continue;
      }

      const correctionAxis = overlapX < overlapY ? { x: 1, y: 0, amount: overlapX } : { x: 0, y: 1, amount: overlapY };
      const correctionAmount = Math.min(MAX_POSITION_CORRECTION, correctionAxis.amount * 0.18);
      if (correctionAmount <= 0.04) {
        continue;
      }

      const direction =
        correctionAxis.x === 1
          ? Math.sign(bodyA.position.x - bodyB.position.x) || 1
          : Math.sign(bodyA.position.y - bodyB.position.y) || -1;
      const shift = {
        x: correctionAxis.x * correctionAmount * direction,
        y: correctionAxis.y * correctionAmount * direction,
      };

      Body.setPosition(bodyA, {
        x: bodyA.position.x + shift.x,
        y: bodyA.position.y + shift.y,
      });
      Body.setPosition(bodyB, {
        x: bodyB.position.x - shift.x,
        y: bodyB.position.y - shift.y,
      });
    }
  }
};

// 这层是工程化的低速稳定器，不追求严格守恒，只避免长时间微抖。
export const applyRestingContactStabilization = (bodyA: GameBody, bodyB: GameBody, normal: MatterVector) => {
  if (
    isCrackingBlock(bodyA)
    || isCrackingBlock(bodyB)
    || bodyA.plugin.supportCollapse
    || bodyB.plugin.supportCollapse
  ) {
    return;
  }

  const inverseMassA = bodyA.isStatic || bodyA.destroyed ? 0 : bodyA.inverseMass;
  const inverseMassB = bodyB.isStatic || bodyB.destroyed ? 0 : bodyB.inverseMass;
  const inverseMassSum = inverseMassA + inverseMassB;
  if (inverseMassSum <= 0) {
    return;
  }

  const relativeVelocity = Vector.sub(bodyA.velocity, bodyB.velocity);
  const normalVelocity = Vector.dot(relativeVelocity, normal);
  const normalSpeed = Math.abs(normalVelocity);
  if (normalSpeed > RESTING_CONTACT_NORMAL_SPEED_THRESHOLD) {
    return;
  }

  const tangentialVelocity = Vector.sub(relativeVelocity, Vector.mult(normal, normalVelocity));
  const tangentialDamping = normalSpeed <= RESTING_CONTACT_MICRO_SPEED_THRESHOLD
    ? RESTING_CONTACT_MICRO_TANGENTIAL_DAMPING
    : RESTING_CONTACT_TANGENTIAL_DAMPING;
  const dampedTangentialVelocity = Vector.mult(tangentialVelocity, tangentialDamping);
  const dampedNormalVelocity = normalSpeed <= RESTING_CONTACT_MICRO_SPEED_THRESHOLD
    ? 0
    : normalSpeed > 0.001
      ? normalVelocity * 0.55
      : 0;
  const correctionVelocity = Vector.sub(
    relativeVelocity,
    Vector.add(
      Vector.mult(normal, dampedNormalVelocity),
      dampedTangentialVelocity,
    ),
  );

  if (!bodyA.isStatic) {
    const share = inverseMassA / inverseMassSum;
    Body.setVelocity(bodyA, Vector.sub(bodyA.velocity, Vector.mult(correctionVelocity, share)));
  }

  if (!bodyB.isStatic) {
    const share = inverseMassB / inverseMassSum;
    Body.setVelocity(bodyB, Vector.add(bodyB.velocity, Vector.mult(correctionVelocity, share)));
  }

  for (const body of [bodyA, bodyB]) {
    if (body.isStatic || body.destroyed) {
      continue;
    }

    const angularDamping = isHorizontalBeamBody(body) ? RESTING_CONTACT_ANGULAR_DAMPING : 0.9;
    if (Math.abs(body.angularVelocity) > 0.002) {
      Body.setAngularVelocity(body, body.angularVelocity * angularDamping);
    }
  }
};

// block-ground 实验模型只在“真实面支撑”时启用，单角接地直接退回默认求解。
export const applyGroundSupportStabilization = (
  pair: IEventCollision<Engine>["pairs"][number],
  bodyA: GameBody,
  bodyB: GameBody,
  normal: MatterVector,
  depth: number,
) => {
  const block = bodyA.renderKind === "block" && bodyB.renderKind === "ground"
    ? bodyA
    : bodyB.renderKind === "block" && bodyA.renderKind === "ground"
      ? bodyB
      : null;
  const ground = block === bodyA ? bodyB : block === bodyB ? bodyA : null;
  if (!block || !ground || block.destroyed || isCrackingBlock(block)) {
    return false;
  }

  const contactDepth = Math.max(0, depth);
  if (contactDepth < GROUND_CONTACT_MIN_DEPTH) {
    return false;
  }

  const groundToBlockNormal = block === bodyA ? Vector.neg(normal) : normal;
  const contactTangent = {
    x: -groundToBlockNormal.y,
    y: groundToBlockNormal.x,
  };
  if ((pair.activeContacts?.length ?? 0) < 2) {
    return false;
  }

  const contactPoint = getPairContactPoint(pair, block, groundToBlockNormal);
  const blockOffset = Vector.sub(contactPoint, block.position);
  const contactSpan = getPairContactSpan(pair, contactTangent);
  if (contactSpan < GROUND_CONTACT_MIN_SUPPORT_SPAN) {
    // 单角接地时不要强行进入稳定支撑模型，否则很容易出现“落地即钉住”。
    return false;
  }

  const groundOffset = Vector.sub(contactPoint, ground.position);
  const blockContactVelocity = velocityAtPoint(block, blockOffset);
  const groundContactVelocity = velocityAtPoint(ground, groundOffset);
  const relativeContactVelocity = Vector.sub(blockContactVelocity, groundContactVelocity);
  const normalVelocity = Vector.dot(relativeContactVelocity, groundToBlockNormal);
  if (Math.abs(normalVelocity) > GROUND_CONTACT_NORMAL_SPEED_THRESHOLD) {
    return false;
  }

  const inverseMass = block.isStatic ? 0 : block.inverseMass;
  const inverseInertia = block.isStatic ? 0 : block.inverseInertia;
  const normalLeverArm = cross2D(blockOffset, groundToBlockNormal);
  const tangentialLeverArm = cross2D(blockOffset, contactTangent);
  const effectiveMassNormal = inverseMass + normalLeverArm * normalLeverArm * inverseInertia;
  const effectiveMassTangent = inverseMass + tangentialLeverArm * tangentialLeverArm * inverseInertia;
  if (effectiveMassNormal <= 1e-6 || effectiveMassTangent <= 1e-6) {
    return false;
  }

  const tangentialVelocity = Vector.dot(relativeContactVelocity, contactTangent);
  const targetNormalSpeedCorrection = Math.min(
    GROUND_CONTACT_POINT_MAX_NORMAL_SPEED_CORRECTION,
    GROUND_CONTACT_POINT_NORMAL_DAMPING * Math.max(0, -normalVelocity),
  );
  const normalImpulseMagnitude = Math.min(
    GROUND_CONTACT_POINT_MAX_NORMAL_IMPULSE,
    targetNormalSpeedCorrection / effectiveMassNormal,
  );
  if (normalImpulseMagnitude <= 0 && Math.abs(tangentialVelocity) < 0.02) {
    return false;
  }

  const targetTangentialSpeedCorrection = -tangentialVelocity * GROUND_CONTACT_POINT_TANGENTIAL_DAMPING;
  const unclampedTangentialImpulse = targetTangentialSpeedCorrection / effectiveMassTangent;
  const maxTangentialImpulse = Math.max(
    normalImpulseMagnitude * GROUND_CONTACT_POINT_MAX_TANGENTIAL_IMPULSE_RATIO,
    GROUND_CONTACT_POINT_MAX_NORMAL_IMPULSE * 0.35,
  );
  const tangentialImpulseMagnitude = Math.max(
    -maxTangentialImpulse,
    Math.min(maxTangentialImpulse, unclampedTangentialImpulse),
  );
  const contactImpulse = Vector.add(
    Vector.mult(groundToBlockNormal, normalImpulseMagnitude),
    Vector.mult(contactTangent, tangentialImpulseMagnitude),
  );
  const nextVelocity = Vector.add(block.velocity, Vector.mult(contactImpulse, inverseMass));
  const angularImpulse = cross2D(blockOffset, contactImpulse);
  const nextAngularVelocity = (block.angularVelocity + angularImpulse * inverseInertia) * GROUND_CONTACT_POST_ANGULAR_DAMPING;

  Body.setVelocity(block, nextVelocity);
  Body.setAngularVelocity(block, nextAngularVelocity);

  return true;
};

export const applyBlockSupportStabilization = (
  bodyA: GameBody,
  bodyB: GameBody,
  normal: MatterVector,
  depth: number,
) => {
  const block = bodyA.renderKind === "block" ? bodyA : bodyB.renderKind === "block" ? bodyB : null;
  const support = block === bodyA ? bodyB : block === bodyB ? bodyA : null;
  if (!block || !support || block.destroyed || support.destroyed) {
    return false;
  }

  if (support.renderKind !== "block" && support.renderKind !== "bird") {
    return false;
  }

  if (support.renderKind === "block" && isCrackingBlock(support)) {
    return false;
  }

  if (bodyA.plugin.supportCollapse || bodyB.plugin.supportCollapse) {
    return false;
  }

  const inverseMassA = block.isStatic ? 0 : block.inverseMass;
  const inverseMassB = support.isStatic ? 0 : support.inverseMass;
  const inverseMassSum = inverseMassA + inverseMassB;
  if (inverseMassSum <= 0) {
    return false;
  }

  const contactDepth = Math.max(0, depth);
  if (contactDepth < BLOCK_SUPPORT_MIN_DEPTH) {
    return false;
  }

  const relativeVelocity = Vector.sub(block.velocity, support.velocity);
  const normalVelocity = Vector.dot(relativeVelocity, normal);
  if (Math.abs(normalVelocity) > BLOCK_SUPPORT_NORMAL_SPEED_THRESHOLD) {
    return false;
  }

  const normalResponse = Math.abs(normalVelocity) <= BLOCK_SUPPORT_MICRO_NORMAL_SPEED_THRESHOLD
    ? 0
    : Math.min(
        BLOCK_SUPPORT_MAX_NORMAL_RESPONSE,
        BLOCK_SUPPORT_DAMPING * Math.max(0, -normalVelocity),
      );

  const tangentialVelocity = Vector.sub(relativeVelocity, Vector.mult(normal, normalVelocity));
  const tangentialCorrection = Vector.mult(tangentialVelocity, 1 - BLOCK_SUPPORT_TANGENTIAL_DAMPING);
  if (normalResponse <= 0 && Vector.magnitude(tangentialCorrection) < 0.015) {
    return false;
  }

  const correctionVelocity = Vector.add(
    Vector.mult(normal, normalResponse),
    Vector.neg(tangentialCorrection),
  );

  if (!block.isStatic) {
    const share = inverseMassA / inverseMassSum;
    Body.setVelocity(block, Vector.sub(block.velocity, Vector.mult(correctionVelocity, share)));
  }

  if (!support.isStatic) {
    const share = inverseMassB / inverseMassSum;
    Body.setVelocity(support, Vector.add(support.velocity, Vector.mult(correctionVelocity, share)));
  }

  for (const body of [block, support]) {
    if (body.isStatic || body.destroyed) {
      continue;
    }

    if (Math.abs(body.angularVelocity) > 0.002) {
      Body.setAngularVelocity(body, body.angularVelocity * BLOCK_SUPPORT_ANGULAR_DAMPING);
    }
  }

  return true;
};

export const applyPigSupportStabilization = (
  bodyA: GameBody,
  bodyB: GameBody,
  normal: MatterVector,
  depth: number,
) => {
  const pig = bodyA.renderKind === "pig" ? bodyA : bodyB.renderKind === "pig" ? bodyB : null;
  const support = pig === bodyA ? bodyB : pig === bodyB ? bodyA : null;
  if (!pig || !support || pig.destroyed || support.destroyed || pig.isStatic) {
    return false;
  }

  if (support.renderKind !== "block" && support.renderKind !== "ground" && support.renderKind !== "bird") {
    return false;
  }

  if (support.renderKind === "block" && isCrackingBlock(support)) {
    return false;
  }

  const inverseMassPig = pig.inverseMass;
  const inverseMassSupport = support.isStatic ? 0 : support.inverseMass;
  const inverseMassSum = inverseMassPig + inverseMassSupport;
  if (inverseMassSum <= 0) {
    return false;
  }

  const contactDepth = Math.max(0, depth);
  if (contactDepth < PIG_SUPPORT_MIN_DEPTH) {
    return false;
  }

  const supportToPigNormal = pig === bodyA ? Vector.neg(normal) : normal;
  const relativeVelocity = Vector.sub(pig.velocity, support.velocity);
  const normalVelocity = Vector.dot(relativeVelocity, supportToPigNormal);
  if (Math.abs(normalVelocity) > PIG_SUPPORT_NORMAL_SPEED_THRESHOLD) {
    return false;
  }

  const normalResponse = Math.abs(normalVelocity) <= PIG_SUPPORT_MICRO_NORMAL_SPEED_THRESHOLD
    ? 0
    : Math.min(
        PIG_SUPPORT_MAX_NORMAL_RESPONSE,
        PIG_SUPPORT_DAMPING * Math.max(0, -normalVelocity),
      );

  const tangentialVelocity = Vector.sub(relativeVelocity, Vector.mult(supportToPigNormal, normalVelocity));
  const tangentialCorrection = Vector.mult(tangentialVelocity, 1 - PIG_SUPPORT_TANGENTIAL_DAMPING);
  if (normalResponse <= 0 && Vector.magnitude(tangentialCorrection) < 0.015) {
    return false;
  }

  const correctionVelocity = Vector.add(
    Vector.mult(supportToPigNormal, normalResponse),
    Vector.neg(tangentialCorrection),
  );

  const pigShare = inverseMassPig / inverseMassSum;
  Body.setVelocity(pig, Vector.add(pig.velocity, Vector.mult(correctionVelocity, pigShare)));

  if (!support.isStatic) {
    const supportTangentialVelocity = Vector.sub(
      support.velocity,
      Vector.mult(supportToPigNormal, Vector.dot(support.velocity, supportToPigNormal)),
    );
    const dampedSupportTangentialVelocity = Vector.mult(
      supportTangentialVelocity,
      PIG_SUPPORT_TANGENTIAL_DAMPING,
    );
    const supportNormalVelocity = Vector.sub(support.velocity, supportTangentialVelocity);
    Body.setVelocity(support, Vector.add(supportNormalVelocity, dampedSupportTangentialVelocity));
  }

  if (Math.abs(pig.angularVelocity) > 0.002) {
    Body.setAngularVelocity(pig, pig.angularVelocity * PIG_SUPPORT_ANGULAR_DAMPING);
  }

  if (!support.isStatic && Math.abs(support.angularVelocity) > 0.002) {
    Body.setAngularVelocity(support, support.angularVelocity * PIG_SUPPORT_COUNTERPART_ANGULAR_DAMPING);
  }

  return true;
};

export const applyBeamSupportStabilization = (bodyA: GameBody, bodyB: GameBody, normal: MatterVector) => {
  const beam = isStableBeamCandidate(bodyA)
    ? bodyA
    : isStableBeamCandidate(bodyB)
      ? bodyB
      : null;
  if (!beam) {
    return;
  }

  const support = beam === bodyA ? bodyB : bodyA;
  if (support.destroyed || (!support.isStatic && support.renderKind !== "block" && support.renderKind !== "ground")) {
    return;
  }

  if (Math.abs(normal.y) < BEAM_SUPPORT_NORMAL_ALIGNMENT_THRESHOLD) {
    // 只有接近“上下支撑”的法向才处理，侧向接触不在这个模型里硬修正。
    return;
  }

  const beamTangent = {
    x: Math.cos(beam.angle),
    y: Math.sin(beam.angle),
  };
  const relativeVelocity = Vector.sub(beam.velocity, support.velocity);
  const relativeTangentSpeed = Vector.dot(relativeVelocity, beamTangent);
  if (Math.abs(relativeTangentSpeed) > 1.4) {
    return;
  }

  if (!beam.isStatic) {
    const beamVelocityAlongTangent = Vector.dot(beam.velocity, beamTangent);
    const beamVelocityNormalComponent = Vector.sub(
      beam.velocity,
      Vector.mult(beamTangent, beamVelocityAlongTangent),
    );
    Body.setVelocity(
      beam,
      Vector.add(
        beamVelocityNormalComponent,
        Vector.mult(beamTangent, beamVelocityAlongTangent * BEAM_SUPPORT_TANGENT_DAMPING),
      ),
    );
    Body.setAngularVelocity(beam, beam.angularVelocity * 0.72);
  }

  if (!support.isStatic) {
    Body.setVelocity(support, {
      x: support.velocity.x * BEAM_SUPPORT_SUPPORT_DAMPING,
      y: support.velocity.y * 0.96,
    });
    if (Math.abs(support.angularVelocity) > 0.002) {
      Body.setAngularVelocity(support, support.angularVelocity * 0.86);
    }
  }
};

export const applyPigBeamStabilization = (bodyA: GameBody, bodyB: GameBody, normal: MatterVector) => {
  const pig = bodyA.renderKind === "pig" ? bodyA : bodyB.renderKind === "pig" ? bodyB : null;
  if (!pig || pig.destroyed || pig.isStatic) {
    return;
  }

  const beam = pig === bodyA ? bodyB : bodyA;
  if (!isPigBeamCandidate(beam) || beam.destroyed) {
    return;
  }

  if (Math.abs(normal.y) < BEAM_SUPPORT_NORMAL_ALIGNMENT_THRESHOLD) {
    return;
  }

  const beamTangent = {
    x: Math.cos(beam.angle),
    y: Math.sin(beam.angle),
  };
  const relativeVelocity = Vector.sub(pig.velocity, beam.velocity);
  const relativeTangentSpeed = Vector.dot(relativeVelocity, beamTangent);
  if (Math.abs(relativeTangentSpeed) > PIG_BEAM_RELATIVE_TANGENT_THRESHOLD) {
    return;
  }

  const pigVelocityAlongTangent = Vector.dot(pig.velocity, beamTangent);
  const pigVelocityNormalComponent = Vector.sub(
    pig.velocity,
    Vector.mult(beamTangent, pigVelocityAlongTangent),
  );
  Body.setVelocity(
    pig,
    Vector.add(
      pigVelocityNormalComponent,
      Vector.mult(beamTangent, pigVelocityAlongTangent * PIG_BEAM_TANGENT_DAMPING),
    ),
  );

  if (Math.abs(pig.angularVelocity) > 0.002) {
    Body.setAngularVelocity(pig, pig.angularVelocity * PIG_BEAM_ANGULAR_DAMPING);
  }

  if (Math.abs(relativeTangentSpeed) < PIG_BEAM_ROLLING_SPEED_THRESHOLD) {
    const rollingVelocity = Vector.mult(
      beamTangent,
      relativeTangentSpeed * PIG_BEAM_ROLLING_RESISTANCE,
    );
    Body.setVelocity(pig, Vector.sub(pig.velocity, rollingVelocity));

    const rollingSpinDamping = Math.max(
      0,
      1 - (PIG_BEAM_ROLLING_SPEED_THRESHOLD - Math.abs(relativeTangentSpeed)) * PIG_BEAM_ROTATION_TO_TRANSLATION_DAMPING,
    );
    Body.setAngularVelocity(pig, pig.angularVelocity * rollingSpinDamping);
  }
};
