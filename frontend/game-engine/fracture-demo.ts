import Matter from "matter-js";
import { computeEffectiveThickness, computeFractureResponse } from "./fracture.js";
import { MATERIAL_PARAMS } from "./materials.js";

const { Bodies } = Matter;

const scenarios = [
  {
    name: "薄玻璃",
    material: "glass" as const,
    body: Bodies.rectangle(0, 0, 14, 80),
    rawImpulse: 12,
  },
  {
    name: "中等木板",
    material: "wood" as const,
    body: Bodies.rectangle(0, 0, 48, 80),
    rawImpulse: 12,
  },
  {
    name: "厚石块",
    material: "stone" as const,
    body: Bodies.rectangle(0, 0, 92, 92),
    rawImpulse: 12,
  },
];

const collisionNormal = { x: 1, y: 0 };

for (const scenario of scenarios) {
  const thickness = computeEffectiveThickness(scenario.body, collisionNormal);
  const fracture = computeFractureResponse(
    MATERIAL_PARAMS[scenario.material],
    thickness,
    scenario.rawImpulse,
  );

  console.log(`${scenario.name}`);
  console.log(`  material = ${scenario.material}`);
  console.log(`  effectiveThickness = ${thickness.toFixed(2)}`);
  console.log(`  breakDurationMs = ${fracture.breakDuration.toFixed(2)}`);
  console.log(`  effectiveImpulse = ${fracture.effectiveImpulse.toFixed(2)}`);
  console.log(`  preserveRatio = ${fracture.velocityPreservationRatio.toFixed(3)}`);
  console.log(`  removalTiming = crackStart + ${fracture.breakDuration.toFixed(2)}ms`);
}
