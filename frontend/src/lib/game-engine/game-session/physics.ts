import { Body, Vector, type Engine, type IEventCollision, type Vector as MatterVector } from "matter-js";
import type { GameBody } from "../types.js";
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
  BLOCK_SUPPORT_STIFFNESS,
  BLOCK_SUPPORT_TANGENTIAL_DAMPING,
  GROUND_CONTACT_MIN_DEPTH,
  GROUND_CONTACT_MIN_SUPPORT_SPAN,
  GROUND_CONTACT_NORMAL_SPEED_THRESHOLD,
  GROUND_CONTACT_POINT_MAX_NORMAL_IMPULSE,
  GROUND_CONTACT_POINT_MAX_NORMAL_SPEED_CORRECTION,
  GROUND_CONTACT_POINT_MAX_TANGENTIAL_IMPULSE_RATIO,
  GROUND_CONTACT_POINT_NORMAL_DAMPING,
  GROUND_CONTACT_POINT_NORMAL_STIFFNESS,
  GROUND_CONTACT_POINT_TANGENTIAL_DAMPING,
  GROUND_CONTACT_POST_ANGULAR_DAMPING,
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
  PIG_SUPPORT_NORMAL_SPEED_THRESHOLD,
  PIG_SUPPORT_STIFFNESS,
  PIG_SUPPORT_TANGENTIAL_DAMPING,
  RESTING_CONTACT_ANGULAR_DAMPING,
  RESTING_CONTACT_NORMAL_SPEED_THRESHOLD,
  RESTING_CONTACT_TANGENTIAL_DAMPING,
  BEAM_ANGULAR_DAMPING,
  cross2D,
  getObstacleAspectRatio,
  getPairContactPoint,
  getPairContactSpan,
  isHorizontalBeamBody,
  isPigBeamCandidate,
  isStableBeamCandidate,
  velocityAtPoint,
} from "./config.js";

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
    if (!bodyA) {
      continue;
    }

    for (let otherIndex = index + 1; otherIndex < bodies.length; otherIndex += 1) {
      const bodyB = bodies[otherIndex];
      if (!bodyB || bodyB.destroyed) {
        continue;
      }

      const overlapX = Math.min(bodyA.bounds.max.x, bodyB.bounds.max.x) - Math.max(bodyA.bounds.min.x, bodyB.bounds.min.x);
      const overlapY = Math.min(bodyA.bounds.max.y, bodyB.bounds.max.y) - Math.max(bodyA.bounds.min.y, bodyB.bounds.min.y);
      if (overlapX <= 0 || overlapY <= 0) {
        continue;
      }

      // 这里只做非常保守的轴向分离，避免深度重叠时继续把系统推向不稳定。
      const correctionAxis = overlapX < overlapY ? { x: 1, y: 0, amount: overlapX } : { x: 0, y: 1, amount: overlapY };
      const correctionAmount = Math.min(MAX_POSITION_CORRECTION, correctionAxis.amount * 0.35);
      if (correctionAmount <= 0.02) {
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

      if (!bodyB.isStatic) {
        Body.setPosition(bodyB, {
          x: bodyB.position.x - shift.x,
          y: bodyB.position.y - shift.y,
        });
      }
    }
  }
};

// 这层是工程化的低速稳定器，不追求严格守恒，只避免长时间微抖。
export const applyRestingContactStabilization = (bodyA: GameBody, bodyB: GameBody, normal: MatterVector) => {
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
  const dampedTangentialVelocity = Vector.mult(tangentialVelocity, RESTING_CONTACT_TANGENTIAL_DAMPING);
  const correctionVelocity = Vector.sub(relativeVelocity, dampedTangentialVelocity);

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
  if (!block || !ground || block.destroyed) {
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
  if (pair.activeContacts.length < 2) {
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

  // 这里不是直接按质心速度修正，而是按接触点速度计算法向/切向冲量。
  const targetNormalSpeedCorrection = Math.min(
    GROUND_CONTACT_POINT_MAX_NORMAL_SPEED_CORRECTION,
    GROUND_CONTACT_POINT_NORMAL_STIFFNESS * contactDepth
    + GROUND_CONTACT_POINT_NORMAL_DAMPING * Math.max(0, -normalVelocity),
  );
  const normalImpulseMagnitude = Math.min(
    GROUND_CONTACT_POINT_MAX_NORMAL_IMPULSE,
    targetNormalSpeedCorrection / effectiveMassNormal,
  );
  if (normalImpulseMagnitude <= 0) {
    return false;
  }

  const tangentialVelocity = Vector.dot(relativeContactVelocity, contactTangent);
  const targetTangentialSpeedCorrection = -tangentialVelocity * GROUND_CONTACT_POINT_TANGENTIAL_DAMPING;
  const unclampedTangentialImpulse = targetTangentialSpeedCorrection / effectiveMassTangent;
  const maxTangentialImpulse = normalImpulseMagnitude * GROUND_CONTACT_POINT_MAX_TANGENTIAL_IMPULSE_RATIO;
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
  if (bodyA.renderKind !== "block" || bodyB.renderKind !== "block" || bodyA.destroyed || bodyB.destroyed) {
    return false;
  }

  const inverseMassA = bodyA.isStatic ? 0 : bodyA.inverseMass;
  const inverseMassB = bodyB.isStatic ? 0 : bodyB.inverseMass;
  const inverseMassSum = inverseMassA + inverseMassB;
  if (inverseMassSum <= 0) {
    return false;
  }

  const contactDepth = Math.max(0, depth);
  if (contactDepth < BLOCK_SUPPORT_MIN_DEPTH) {
    return false;
  }

  const relativeVelocity = Vector.sub(bodyA.velocity, bodyB.velocity);
  const normalVelocity = Vector.dot(relativeVelocity, normal);
  if (Math.abs(normalVelocity) > BLOCK_SUPPORT_NORMAL_SPEED_THRESHOLD) {
    return false;
  }

  const normalResponse = Math.min(
    BLOCK_SUPPORT_MAX_NORMAL_RESPONSE,
    BLOCK_SUPPORT_STIFFNESS * contactDepth + BLOCK_SUPPORT_DAMPING * Math.max(0, -normalVelocity),
  );
  if (normalResponse <= 0) {
    return false;
  }

  const tangentialVelocity = Vector.sub(relativeVelocity, Vector.mult(normal, normalVelocity));
  const tangentialCorrection = Vector.mult(tangentialVelocity, 1 - BLOCK_SUPPORT_TANGENTIAL_DAMPING);
  const correctionVelocity = Vector.add(
    Vector.mult(normal, normalResponse),
    Vector.neg(tangentialCorrection),
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

  if (support.renderKind !== "block" && support.renderKind !== "ground") {
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

  const normalResponse = Math.min(
    PIG_SUPPORT_MAX_NORMAL_RESPONSE,
    PIG_SUPPORT_STIFFNESS * contactDepth + PIG_SUPPORT_DAMPING * Math.max(0, -normalVelocity),
  );
  if (normalResponse <= 0) {
    return false;
  }

  const tangentialVelocity = Vector.sub(relativeVelocity, Vector.mult(supportToPigNormal, normalVelocity));
  const tangentialCorrection = Vector.mult(tangentialVelocity, 1 - PIG_SUPPORT_TANGENTIAL_DAMPING);
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
