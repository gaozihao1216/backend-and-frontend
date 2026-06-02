import type { User } from "../data/store-contracts.js";

declare global {
  namespace Express {
    interface Request {
      currentUser?: User;
    }
  }
}

export {};
