import type { Body, Engine } from "matter-js";
import type { LevelGround, Position } from "../level-contracts.js";
import type { CombatProfile } from "./combat-profile.js";
import type { BirdSkillSet } from "./skills/skill-spec.js";
import type { StatusEffectInstance } from "./skills/status-effects.js";
import type { SkillVisualEffect } from "./skills/skill-executors.js";

export type GameBodyKind = "ground" | "block" | "pig" | "bird";

export type GameStatus = "ready" | "running" | "won" | "lost";

export type ObstacleMaterial = "wood" | "stone" | "glass";

export type BlockState = "intact" | "cracking" | "broken";

export type CrackPoint = {
  x: number;
  y: number;
};

export type CrackSegment = {
  points: CrackPoint[];
};

export type DamageVisualState = {
  cracks: CrackSegment[];
  damageRatio: number;
};

export type BlockGameEntity = {
  kind: "block";
  material: ObstacleMaterial;
  hp: number;
  maxHp: number;
  state: BlockState;
  crackStartTime: number | null;
  breakDuration: number;
  effectiveThickness: number;
  pendingRemoval: boolean;
  collisionCooldownUntil: number;
};

export type GameEntity =
  | { kind: "ground"; groundType?: LevelGround["type"]; surfaceRole?: "ground" | "ceiling" }
  | { kind: "pig" }
  | { kind: "bird"; combatProfile: CombatProfile; birdType: string; name: string; fillColor: string }
  | BlockGameEntity;

export type GroundRenderPath = {
  type: LevelGround["type"];
  points: Position[];
};

export type GameBody = Body & {
  renderKind?: GameBodyKind;
  health?: number;
  maxHealth?: number;
  destroyed?: boolean;
  damageVisuals?: DamageVisualState;
  renderWidth?: number;
  renderHeight?: number;
  plugin: Body["plugin"] & {
    gameEntity?: GameEntity;
    birdSupportFrom?: number;
    physicsSettling?: {
      supported: boolean;
    };
    supportCollapse?: boolean;
    statusEffects?: StatusEffectInstance[];
    skillProjectile?: {
      kind: "vertical_bomb";
      blastRadius: number;
      structureDamage: number;
      pigDamage: number;
      sourceBirdId: number;
      spawnAtMs: number;
      armed: boolean;
    };
  };
};

export type GameSnapshot = {
  width: number;
  height: number;
  bodies: GameBody[];
  groundPaths: GroundRenderPath[];
  ceilingPaths: GroundRenderPath[];
  birdLaunched: boolean;
  isDragging: boolean;
  status: GameStatus;
  slingshotAnchor: {
    x: number;
    y: number;
  };
  birdsRemaining: number;
  shotsRemaining: number;
  awaitingBirdSelection: boolean;
  birdReadyOnSlingshot: boolean;
  selectableBirds: Array<{
    birdType: string;
    name: string;
    fillColor: string;
    remaining: number;
  }>;
  activeBirdName: string;
  activeBirdType: string;
  skillVisuals: SkillVisualEffect[];
};

export type GameSession = {
  engine: Engine;
  getSnapshot: () => GameSnapshot;
  selectBird: (birdType: string) => boolean;
  beginDrag: (x: number, y: number) => boolean;
  updateDrag: (x: number, y: number) => void;
  endDrag: () => void;
  step: (deltaMs: number) => void;
  activateSkill: () => boolean;
  destroy: () => void;
};
