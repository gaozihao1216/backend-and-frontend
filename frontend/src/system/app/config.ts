export const API_USERS = {
  designer: {
    id: "designer-1",
    label: "Designer One",
  },
  admin: {
    id: "admin-1",
    label: "Admin One",
  },
  player: {
    id: "player-1",
    label: "Player One",
  },
} as const;

const viteEnv = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;

export const API_BASE_URL = viteEnv?.VITE_API_BASE_URL?.trim() ?? "";

export type FrontendRole = keyof typeof API_USERS;
