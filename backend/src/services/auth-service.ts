import type { BindBackendUserInput, User } from "../domain/store-contracts.js";
import { userService } from "./user-service.js";

export class AuthService {
  getBackendUsers(): User[] {
    return userService.getAll();
  }

  bindBackendUser(input: BindBackendUserInput): User {
    return userService.bindLocalUser(input);
  }
}

export const authService = new AuthService();
