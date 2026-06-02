import type { User } from "./object/store-contracts.js";

declare global {
  namespace Express {
    interface Request {
      currentUser?: User;
    }
  }
}

export {};
