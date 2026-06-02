import type { BindBackendUserRequestBody, BoundBackendUser } from "../data/store-contracts.js";
import { userService } from "./user-service.js";

export class AuthService {
  getBackendUsers(): BoundBackendUser[] {
    return userService.getAll();
  }

  bindBackendUser(input: BindBackendUserRequestBody): BoundBackendUser {
    return userService.bindLocalUser(input);
  }
}

export const authService = new AuthService();
