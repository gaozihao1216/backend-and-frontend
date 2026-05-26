import fs from "node:fs";
import path from "node:path";
import {
  LevelSchema,
  type Comment,
  type Favorite,
  type Level,
  type Rating,
  type Submission,
  type User,
} from "../../shared/types.js";
import { CommentSchema } from "../../shared/schemas/comment.js";
import { FavoriteSchema } from "../../shared/schemas/favorite.js";
import { RatingSchema } from "../../shared/schemas/rating.js";
import { SubmissionSchema } from "../../shared/schemas/submission.js";
import { UserSchema } from "../../shared/schemas/user.js";
import {
  STARTER_LEVEL_DATA,
  STARTER_LEVEL_DESCRIPTION,
  STARTER_LEVEL_ID,
  STARTER_LEVEL_TAGS,
  STARTER_LEVEL_TITLE,
} from "../../shared/levels/index.js";

const now = () => new Date().toISOString();
const STORE_DIR = path.join(process.cwd(), "data");
const STORE_FILE = path.join(STORE_DIR, "backend-store.json");

const isTestEnvironment = () =>
  process.env.NODE_ENV === "test" || process.execArgv.includes("--test");

type StoreState = {
  users: User[];
  levels: Level[];
  submissions: Submission[];
  ratings: Rating[];
  comments: Comment[];
  favorites: Favorite[];
};

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const createDefaultState = (): StoreState => ({
  users: [
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
  ].map((user) => UserSchema.parse(user)),
  levels: [
    LevelSchema.parse({
      id: STARTER_LEVEL_ID,
      title: STARTER_LEVEL_TITLE,
      description: STARTER_LEVEL_DESCRIPTION,
      tags: STARTER_LEVEL_TAGS,
      data: STARTER_LEVEL_DATA,
      authorId: "designer-1",
      status: "published",
      averageRating: 0,
      ratingCount: 0,
      createdAt: now(),
      updatedAt: now(),
      publishedAt: now(),
    }),
  ],
  submissions: [],
  ratings: [],
  comments: [],
  favorites: [],
});

const parseStoreState = (value: unknown): StoreState => {
  const input = value as Partial<StoreState> | undefined;
  return {
    users: (input?.users ?? []).map((entry) => UserSchema.parse(entry)),
    levels: (input?.levels ?? []).map((entry) => LevelSchema.parse(entry)),
    submissions: (input?.submissions ?? []).map((entry) => SubmissionSchema.parse(entry)),
    ratings: (input?.ratings ?? []).map((entry) => RatingSchema.parse(entry)),
    comments: (input?.comments ?? []).map((entry) => CommentSchema.parse(entry)),
    favorites: (input?.favorites ?? []).map((entry) => FavoriteSchema.parse(entry)),
  };
};

const loadStoreState = (): StoreState => {
  if (isTestEnvironment()) {
    return createDefaultState();
  }

  try {
    const raw = fs.readFileSync(STORE_FILE, "utf8");
    return parseStoreState(JSON.parse(raw) as unknown);
  } catch {
    const initialState = createDefaultState();
    persistStoreState(initialState);
    return initialState;
  }
};

const persistStoreState = (state: StoreState) => {
  if (isTestEnvironment()) {
    return;
  }

  fs.mkdirSync(STORE_DIR, { recursive: true });
  fs.writeFileSync(STORE_FILE, JSON.stringify(state, null, 2));
};

const replaceContents = <T>(target: T[], next: T[]) => {
  target.splice(0, target.length, ...next);
};

const initialState = loadStoreState();

export const users: User[] = clone(initialState.users);
export const levels: Level[] = clone(initialState.levels);
export const submissions: Submission[] = clone(initialState.submissions);
export const ratings: Rating[] = clone(initialState.ratings);
export const comments: Comment[] = clone(initialState.comments);
export const favorites: Favorite[] = clone(initialState.favorites);

const getCurrentState = (): StoreState => ({
  users,
  levels,
  submissions,
  ratings,
  comments,
  favorites,
});

export const saveStore = () => {
  persistStoreState(getCurrentState());
};

export const resetStore = () => {
  const defaultState = createDefaultState();
  replaceContents(users, clone(defaultState.users));
  replaceContents(levels, clone(defaultState.levels));
  replaceContents(submissions, []);
  replaceContents(ratings, []);
  replaceContents(comments, []);
  replaceContents(favorites, []);
  saveStore();
};

