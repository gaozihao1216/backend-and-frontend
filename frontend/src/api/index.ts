import { LevelDataSchema, type CreateLevelInput, type LevelData } from "../lib/level-contracts.js";

export * from "./auth-api.js";
export * from "./user-api.js";
export * from "./designer-api.js";
export * from "./admin-api.js";
export * from "./player-api.js";
export * from "./system-api.js";

export const parseLevelDataInput = (value: string): LevelData =>
  LevelDataSchema.parse(JSON.parse(value) as unknown);

export const createDefaultLevelInput = (): CreateLevelInput => ({
  title: "",
  description: "",
  tags: [],
  data: {
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
    obstacles: [],
    enemies: [
      {
        id: "enemy-1",
        type: "pig",
        position: {
          x: 900,
          y: 120,
        },
      },
    ],
  },
});
