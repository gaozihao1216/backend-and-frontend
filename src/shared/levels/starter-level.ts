import type { LevelData, LevelTag } from "../types.js";

export const STARTER_LEVEL_ID = "level-1";
export const STARTER_LEVEL_TITLE = "Starter Level";
export const STARTER_LEVEL_DESCRIPTION = "预置示例关卡";
export const STARTER_LEVEL_TAGS: LevelTag[] = ["beginner", "puzzle"];

export const STARTER_LEVEL_DATA: LevelData = {
  world: {
    width: 1200,
    height: 800,
    gravity: 9.8,
  },
  ground: {
    type: "line",
    points: [
      { x: 0, y: 752 },
      { x: 600, y: 752 },
      { x: 1200, y: 752 },
    ],
  },
  birdInventory: {
    basic: 3,
  },
  obstacles: [
    {
      id: "obstacle-glass-panel",
      material: "glass",
      position: {
        x: 700,
        y: 640,
      },
      size: {
        width: 20,
        height: 140,
      },
    },
    {
      id: "obstacle-wood-panel",
      material: "wood",
      position: {
        x: 860,
        y: 630,
      },
      size: {
        width: 44,
        height: 150,
      },
    },
    {
      id: "obstacle-stone-block",
      material: "stone",
      position: {
        x: 1040,
        y: 640,
      },
      size: {
        width: 96,
        height: 96,
      },
    },
    {
      id: "obstacle-wood-ledge",
      material: "wood",
      position: {
        x: 900,
        y: 540,
      },
      size: {
        width: 180,
        height: 24,
      },
    },
    {
      id: "obstacle-glass-top",
      material: "glass",
      position: {
        x: 700,
        y: 518,
      },
      size: {
        width: 72,
        height: 20,
      },
    },
  ],
  enemies: [
    {
      id: "enemy-1",
      type: "pig",
      position: {
        x: 900,
        y: 470,
      },
    },
    {
      id: "enemy-2",
      type: "pig",
      position: {
        x: 1040,
        y: 565,
      },
    },
  ],
};
