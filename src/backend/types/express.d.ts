import type { User } from "../../shared/types.js";

declare global {
  namespace Express {
    interface Request {
      currentUser?: User;
    }
  }
}

export {};
