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

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim() ?? "";

export type FrontendRole = keyof typeof API_USERS;
