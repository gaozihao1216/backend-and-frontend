import {
  LevelSchema,
  type Comment,
  type Favorite,
  type Level,
  type Rating,
  type Submission,
  type User,
} from "../../shared/types.js";

const now = () => new Date().toISOString();

export const users: User[] = [
  {
    id: "player-1",
    username: "player1",
    displayName: "Player One",
    role: "player",
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: "designer-1",
    username: "designer1",
    displayName: "Designer One",
    role: "designer",
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: "admin-1",
    username: "admin1",
    displayName: "Admin One",
    role: "admin",
    createdAt: now(),
    updatedAt: now(),
  },
];

export const levels: Level[] = [
  LevelSchema.parse({
    id: "level-1",
    title: "Starter Level",
    description: "预置示例关卡",
    tags: ["beginner", "puzzle"],
    data: {
      world: {
        width: 1200,
        height: 800,
        gravity: 9.8,
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
    authorId: "designer-1",
    status: "published",
    averageRating: 0,
    ratingCount: 0,
    createdAt: now(),
    updatedAt: now(),
    publishedAt: now(),
  }),
];
export const submissions: Submission[] = [];
export const ratings: Rating[] = [];
export const comments: Comment[] = [];
export const favorites: Favorite[] = [];
