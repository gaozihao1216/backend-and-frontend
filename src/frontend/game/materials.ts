import type { ObstacleMaterial } from "./types.js";

export type MaterialParams = {
  fractureThreshold: number;
  maxResistForce: number;
  crackSpeed: number;
  maxHp: number;
  damageFactor: number;
};

export const MATERIAL_PARAMS: Record<ObstacleMaterial, MaterialParams> = {
  wood: {
    fractureThreshold: 4.6,
    maxResistForce: 82,
    crackSpeed: 680,
    maxHp: 90,
    damageFactor: 2.4,
  },
  stone: {
    fractureThreshold: 8.5,
    maxResistForce: 180,
    crackSpeed: 320,
    maxHp: 220,
    damageFactor: 1.25,
  },
  glass: {
    fractureThreshold: 3.2,
    maxResistForce: 44,
    crackSpeed: 1120,
    maxHp: 52,
    damageFactor: 3.3,
  },
};

export const DEFAULT_BLOCK_MATERIAL: ObstacleMaterial = "wood";
