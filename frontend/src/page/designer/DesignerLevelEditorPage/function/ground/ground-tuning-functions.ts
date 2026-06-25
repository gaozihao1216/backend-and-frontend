import {
  getDefaultGroundMaterialRenderConfig,
  type GroundMaterialRenderConfig,
} from "../../../../../game/engine/render/draw-scene.js";
import {
  DEFAULT_GROUND_STROKE_SIMPLIFY_CONFIG,
  getDefaultBoundaryBreakpointEpsilon,
  type GroundStrokeSimplifyConfig,
} from "../../../../../level/function/ground.js";

export const GROUND_TUNING_LIMITS = {
  minSpan: { min: 8, max: 48, step: 1 },
  angleWeight: { min: 0, max: 3, step: 0.05 },
  stopEpsilon: { min: 0, max: 2, step: 0.05 },
  breakpointEpsilon: { min: 0, max: 72, step: 1 },
  noGrassSlope: { min: 0.1, max: 1.5, step: 0.01 },
  cliffStart: { min: 0.01, max: 1.2, step: 0.01 },
  cliffEnd: { min: 0.05, max: 2, step: 0.01 },
  cliffRockBoost: { min: 0, max: 1.5, step: 0.01 },
  noiseStrength: { min: 0, max: 0.25, step: 0.01 },
  a1: { min: 0, max: 1, step: 0.01 },
  a2: { min: 0, max: 1.5, step: 0.01 },
  alphaBase: { min: 0.2, max: 3, step: 0.01 },
  alphaJitter: { min: 0, max: 1, step: 0.01 },
  sigmoidA: { min: 0.2, max: 2.5, step: 0.01 },
  sigmoidBeta: { min: 0.5, max: 16, step: 0.1 },
  sigmoidGamma: { min: 0.05, max: 1.5, step: 0.01 },
  grassCurveSampleStep: { min: 8, max: 40, step: 1 },
  grassCurveSmoothingPasses: { min: 0, max: 5, step: 1 },
} as const;

export const normalizeAngle = (angle: number) => {
  if (angle > Math.PI) {
    return angle - Math.PI * 2;
  }
  if (angle < -Math.PI) {
    return angle + Math.PI * 2;
  }
  return angle;
};

export const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export const sanitizeGroundStrokeSimplifyConfig = (
  value: Partial<GroundStrokeSimplifyConfig> | null | undefined,
): GroundStrokeSimplifyConfig => ({
  minSpan: clamp(
    typeof value?.minSpan === "number" ? value.minSpan : DEFAULT_GROUND_STROKE_SIMPLIFY_CONFIG.minSpan,
    GROUND_TUNING_LIMITS.minSpan.min,
    GROUND_TUNING_LIMITS.minSpan.max,
  ),
  angleWeight: clamp(
    typeof value?.angleWeight === "number" ? value.angleWeight : DEFAULT_GROUND_STROKE_SIMPLIFY_CONFIG.angleWeight,
    GROUND_TUNING_LIMITS.angleWeight.min,
    GROUND_TUNING_LIMITS.angleWeight.max,
  ),
  stopEpsilon: clamp(
    typeof value?.stopEpsilon === "number" ? value.stopEpsilon : DEFAULT_GROUND_STROKE_SIMPLIFY_CONFIG.stopEpsilon,
    GROUND_TUNING_LIMITS.stopEpsilon.min,
    GROUND_TUNING_LIMITS.stopEpsilon.max,
  ),
});

export const sanitizeBoundaryBreakpointEpsilon = (value: number | null | undefined) =>
  clamp(
    typeof value === "number" ? value : getDefaultBoundaryBreakpointEpsilon(),
    GROUND_TUNING_LIMITS.breakpointEpsilon.min,
    GROUND_TUNING_LIMITS.breakpointEpsilon.max,
  );

export const sanitizeGroundMaterialRenderConfig = (
  value: Partial<GroundMaterialRenderConfig> | null | undefined,
): GroundMaterialRenderConfig => {
  const defaults = getDefaultGroundMaterialRenderConfig();
  return {
    cliffStart: clamp(typeof value?.cliffStart === "number" ? value.cliffStart : defaults.cliffStart, GROUND_TUNING_LIMITS.cliffStart.min, GROUND_TUNING_LIMITS.cliffStart.max),
    cliffEnd: clamp(typeof value?.cliffEnd === "number" ? value.cliffEnd : defaults.cliffEnd, GROUND_TUNING_LIMITS.cliffEnd.min, GROUND_TUNING_LIMITS.cliffEnd.max),
    noGrassSlope: clamp(typeof value?.noGrassSlope === "number" ? value.noGrassSlope : defaults.noGrassSlope, GROUND_TUNING_LIMITS.noGrassSlope.min, GROUND_TUNING_LIMITS.noGrassSlope.max),
    cliffRockBoost: clamp(typeof value?.cliffRockBoost === "number" ? value.cliffRockBoost : defaults.cliffRockBoost, GROUND_TUNING_LIMITS.cliffRockBoost.min, GROUND_TUNING_LIMITS.cliffRockBoost.max),
    cliffGrassPenalty: defaults.cliffGrassPenalty,
    noiseScale: defaults.noiseScale,
    noiseStrength: clamp(typeof value?.noiseStrength === "number" ? value.noiseStrength : defaults.noiseStrength, GROUND_TUNING_LIMITS.noiseStrength.min, GROUND_TUNING_LIMITS.noiseStrength.max),
    a1: clamp(typeof value?.a1 === "number" ? value.a1 : defaults.a1, GROUND_TUNING_LIMITS.a1.min, GROUND_TUNING_LIMITS.a1.max),
    a2: clamp(typeof value?.a2 === "number" ? value.a2 : defaults.a2, GROUND_TUNING_LIMITS.a2.min, GROUND_TUNING_LIMITS.a2.max),
    alphaBase: clamp(typeof value?.alphaBase === "number" ? value.alphaBase : defaults.alphaBase, GROUND_TUNING_LIMITS.alphaBase.min, GROUND_TUNING_LIMITS.alphaBase.max),
    alphaJitter: clamp(typeof value?.alphaJitter === "number" ? value.alphaJitter : defaults.alphaJitter, GROUND_TUNING_LIMITS.alphaJitter.min, GROUND_TUNING_LIMITS.alphaJitter.max),
    sigmoidA: clamp(typeof value?.sigmoidA === "number" ? value.sigmoidA : defaults.sigmoidA, GROUND_TUNING_LIMITS.sigmoidA.min, GROUND_TUNING_LIMITS.sigmoidA.max),
    sigmoidBeta: clamp(typeof value?.sigmoidBeta === "number" ? value.sigmoidBeta : defaults.sigmoidBeta, GROUND_TUNING_LIMITS.sigmoidBeta.min, GROUND_TUNING_LIMITS.sigmoidBeta.max),
    sigmoidGamma: clamp(typeof value?.sigmoidGamma === "number" ? value.sigmoidGamma : defaults.sigmoidGamma, GROUND_TUNING_LIMITS.sigmoidGamma.min, GROUND_TUNING_LIMITS.sigmoidGamma.max),
    grassCurveSampleStep: clamp(typeof value?.grassCurveSampleStep === "number" ? value.grassCurveSampleStep : defaults.grassCurveSampleStep, GROUND_TUNING_LIMITS.grassCurveSampleStep.min, GROUND_TUNING_LIMITS.grassCurveSampleStep.max),
    grassCurveSmoothingPasses: clamp(typeof value?.grassCurveSmoothingPasses === "number" ? value.grassCurveSmoothingPasses : defaults.grassCurveSmoothingPasses, GROUND_TUNING_LIMITS.grassCurveSmoothingPasses.min, GROUND_TUNING_LIMITS.grassCurveSmoothingPasses.max),
  };
};
