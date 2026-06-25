import type { LevelData } from "../../../objects/level/level/level-data.js";
import { WORLD_HEIGHT, WORLD_WIDTH } from "../core/constants.js";

const DROP_TEST_GROUND_Y = WORLD_HEIGHT - 48;

export const createDropTestGround = () => ({
  type: "line" as const,
  points: [
    { x: 0, y: DROP_TEST_GROUND_Y },
    { x: WORLD_WIDTH / 2, y: DROP_TEST_GROUND_Y },
    { x: WORLD_WIDTH, y: DROP_TEST_GROUND_Y },
  ],
});

export const createSoloPigDropLevel = (): LevelData => ({
  world: { width: WORLD_WIDTH, height: WORLD_HEIGHT, gravity: 9.8 },
  ground: createDropTestGround(),
  birdInventory: { basic: 1 },
  obstacles: [],
  enemies: [
    {
      id: "solo-pig",
      type: "pig",
      position: { x: WORLD_WIDTH * 0.5, y: 120 },
      size: { width: 44, height: 44 },
    },
  ],
});

export const createPigBesideWoodDropLevel = (): LevelData => ({
  world: { width: WORLD_WIDTH, height: WORLD_HEIGHT, gravity: 9.8 },
  ground: createDropTestGround(),
  birdInventory: { basic: 1 },
  obstacles: [
    {
      id: "side-wood",
      material: "wood",
      position: { x: WORLD_WIDTH * 0.5 + 88, y: 120 },
      size: { width: 72, height: 72 },
    },
  ],
  enemies: [
    {
      id: "paired-pig",
      type: "pig",
      position: { x: WORLD_WIDTH * 0.5, y: 120 },
      size: { width: 44, height: 44 },
    },
  ],
});

export const createStackedWoodDropLevel = (): LevelData => ({
  world: { width: WORLD_WIDTH, height: WORLD_HEIGHT, gravity: 9.8 },
  ground: createDropTestGround(),
  birdInventory: { basic: 1 },
  obstacles: [
    {
      id: "stack-base",
      material: "wood",
      position: { x: WORLD_WIDTH * 0.5, y: DROP_TEST_GROUND_Y - 40 },
      size: { width: 72, height: 72 },
    },
    {
      id: "stack-top",
      material: "wood",
      position: { x: WORLD_WIDTH * 0.5, y: DROP_TEST_GROUND_Y - 112 },
      size: { width: 72, height: 72 },
    },
  ],
  enemies: [],
});
