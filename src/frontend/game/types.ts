import type { Body, Engine } from "matter-js";
import type { LevelGround, Position } from "../../shared/types.js";

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
  | { kind: "bird" }
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
};

export type GameSession = {
  engine: Engine;
  getSnapshot: () => GameSnapshot;
  beginDrag: (x: number, y: number) => boolean;
  updateDrag: (x: number, y: number) => void;
  endDrag: () => void;
  step: (deltaMs: number) => void;
  destroy: () => void;
};
