import type { LevelData } from "../../objects/level/level/level-data.js";
import {
  BLOCK_HEIGHT,
  BLOCK_WIDTH,
  GROUND_HEIGHT,
  PIG_RADIUS,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from "../../game/engine/core/constants.js";

const GROUND_Y = WORLD_HEIGHT - GROUND_HEIGHT;
const TOWER_X = WORLD_WIDTH * 0.72;

/** 总监技能实验室用的简易试玩关卡：木塔 + 玻璃 + 两只猪，便于测试冲击/分裂/范围技能。 */
export const SKILL_TEST_LEVEL_DATA: LevelData = {
  world: {
    width: WORLD_WIDTH,
    height: WORLD_HEIGHT,
    gravity: 9.8,
  },
  ground: {
    type: "line",
    points: [
      { x: 0, y: GROUND_Y },
      { x: WORLD_WIDTH / 2, y: GROUND_Y },
      { x: WORLD_WIDTH, y: GROUND_Y },
    ],
  },
  birdInventory: {
    basic: 5,
  },
  obstacles: [
    {
      id: "skill-test-base",
      material: "wood",
      position: { x: TOWER_X, y: GROUND_Y - BLOCK_HEIGHT / 2 },
      size: { width: BLOCK_WIDTH, height: BLOCK_HEIGHT },
    },
    {
      id: "skill-test-mid",
      material: "wood",
      position: { x: TOWER_X, y: GROUND_Y - BLOCK_HEIGHT * 1.5 },
      size: { width: BLOCK_WIDTH, height: BLOCK_HEIGHT },
    },
    {
      id: "skill-test-beam",
      material: "wood",
      position: { x: TOWER_X, y: GROUND_Y - BLOCK_HEIGHT * 2.35 },
      size: { width: BLOCK_WIDTH * 1.6, height: BLOCK_HEIGHT * 0.45 },
    },
    {
      id: "skill-test-glass",
      material: "glass",
      position: { x: TOWER_X - 96, y: GROUND_Y - BLOCK_HEIGHT / 2 },
      size: { width: BLOCK_WIDTH * 0.66, height: BLOCK_HEIGHT },
    },
    {
      id: "skill-test-stone",
      material: "stone",
      position: { x: TOWER_X + 88, y: GROUND_Y - BLOCK_HEIGHT / 2 },
      size: { width: BLOCK_WIDTH * 0.55, height: BLOCK_HEIGHT * 0.55 },
    },
  ],
  enemies: [
    {
      id: "skill-test-pig-top",
      type: "pig",
      position: { x: TOWER_X, y: GROUND_Y - BLOCK_HEIGHT * 3.1 },
      size: { width: PIG_RADIUS * 2, height: PIG_RADIUS * 2 },
    },
    {
      id: "skill-test-pig-side",
      type: "pig",
      position: { x: TOWER_X + 130, y: GROUND_Y - PIG_RADIUS - 6 },
      size: { width: PIG_RADIUS * 2, height: PIG_RADIUS * 2 },
    },
  ],
};
