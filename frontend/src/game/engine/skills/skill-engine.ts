import type { BirdDefinition } from "../bird/bird-definition.js";
import type { GameBody } from "../core/types.js";
import { resolveSkillStage, type BirdSkillStage } from "./skill-spec.js";
import type { CombatEffects } from "./combat-effects.js";
import {
  executeSkillSpec,
  tickBalloonPush,
  tickPendingBombs,
  type BalloonPushState,
  type PendingBombDrop,
  type SkillVisualEffect,
  type SpeedBoostState,
} from "./skill-executors.js";
import { tickStatusEffects } from "./status-effects.js";

export type SkillEngineDeps = {
  getBird: () => GameBody | null;
  getBirdDefinition: () => BirdDefinition | null;
  getBodies: () => GameBody[];
  getNowMs: () => number;
  isSkillAllowed: () => boolean;
  combat: CombatEffects;
  addBody: (body: GameBody) => void;
  removeBody: (body: GameBody) => void;
};

export type SkillEngine = {
  activateSkill: () => boolean;
  tick: (deltaMs: number) => void;
  getVisuals: () => SkillVisualEffect[];
  clearShotState: () => void;
};

type ShotSkillState = {
  activationsUsed: number;
  lastActivationMs: number;
  balloonState: BalloonPushState | null;
  speedBoost: SpeedBoostState | null;
  pendingBombs: PendingBombDrop[];
  visuals: SkillVisualEffect[];
};

/**
 * 创建鸟类技能引擎。
 *
 * 技能引擎只管理“当前这一发”的技能状态：点击触发次数、冷却、延迟炸弹、
 * 气球推力、加速状态和临时视觉效果。发射结算后由 clearShotState 重置。
 */
export const createSkillEngine = (deps: SkillEngineDeps): SkillEngine => {
  let shotState: ShotSkillState = createEmptyShotState();

  // 每次执行技能前重新取鸟、鸟定义和世界物体，避免闭包引用到已移除的 body。
  const createExecutionContext = () => {
    const bird = deps.getBird();
    const birdDefinition = deps.getBirdDefinition();
    if (!bird || !birdDefinition) {
      return null;
    }

    return {
      nowMs: deps.getNowMs(),
      bird,
      birdDefinition,
      bodies: deps.getBodies(),
      combat: deps.combat,
      addBody: deps.addBody,
      removeBody: deps.removeBody,
      pushVisual: (visual: SkillVisualEffect) => {
        shotState.visuals.push(visual);
      },
    };
  };

  // 鸟的技能阶段由配置和战斗阶级共同决定。
  const resolveStage = (): BirdSkillStage | null => {
    const birdDefinition = deps.getBirdDefinition();
    if (!birdDefinition) {
      return null;
    }

    return resolveSkillStage(birdDefinition.skills, birdDefinition.combatProfile.tier);
  };

  const activateSkill = () => {
    if (!deps.isSkillAllowed()) {
      return false;
    }

    const stage = resolveStage();
    const ctx = createExecutionContext();
    if (!stage || !ctx || stage.trigger !== "on_tap") {
      return false;
    }

    const maxActivations = stage.maxActivations ?? 1;
    if (shotState.activationsUsed >= maxActivations) {
      return false;
    }

    const cooldownMs = stage.cooldownMs ?? 0;
    if (cooldownMs > 0 && ctx.nowMs - shotState.lastActivationMs < cooldownMs) {
      return false;
    }

    // 一个技能阶段可以包含多个 spec，例如加速、投弹和视觉效果可以组合触发。
    let removeBird = false;
    for (const spec of stage.specs) {
      const result = executeSkillSpec(spec, ctx);
      if (result.balloonState) {
        shotState.balloonState = result.balloonState;
      }
      if (result.speedBoost) {
        shotState.speedBoost = result.speedBoost;
      }
      if (result.pendingBombs) {
        shotState.pendingBombs.push(...result.pendingBombs);
      }
      if (result.removeBird) {
        removeBird = true;
      }
    }

    shotState.activationsUsed += 1;
    shotState.lastActivationMs = ctx.nowMs;

    if (removeBird) {
      deps.removeBody(ctx.bird);
    }

    return true;
  };

  // 帧循环驱动持续性技能与状态效果，所有过期视觉也在这里清理。
  const tick = (deltaMs: number) => {
    const ctx = createExecutionContext();
    const nowMs = deps.getNowMs();
    shotState.visuals = shotState.visuals.filter((visual) => visual.expiresAtMs > nowMs);

    if (ctx?.bird && shotState.balloonState) {
      const finished = tickBalloonPush(shotState.balloonState, ctx, nowMs);
      if (finished) {
        shotState.balloonState = null;
      }
    }

    if (ctx) {
      shotState.pendingBombs = tickPendingBombs(shotState.pendingBombs, ctx, nowMs);
    }

    tickStatusEffects(deps.getBodies(), deltaMs, deps.combat, ctx?.bird ?? null);

    if (ctx?.bird && shotState.speedBoost && nowMs >= shotState.speedBoost.expiresAtMs) {
      shotState.speedBoost = null;
    }
  };

  return {
    activateSkill,
    tick,
    getVisuals: () => shotState.visuals,
    clearShotState: () => {
      shotState = createEmptyShotState();
    },
  };
};

const createEmptyShotState = (): ShotSkillState => ({
  activationsUsed: 0,
  lastActivationMs: -Infinity,
  balloonState: null,
  speedBoost: null,
  pendingBombs: [],
  visuals: [],
});
