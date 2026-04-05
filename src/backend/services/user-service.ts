import type { BindBackendUserInput, User, UserProfile } from "../../shared/types.js";
import { comments, favorites, levels, ratings, users } from "../data/store.js";
import { HttpError } from "../lib/http.js";

const now = () => new Date().toISOString();
const USERNAME_HASH_RADIX = 36;

const createBoundUsername = (role: BindBackendUserInput["role"], localUserId: string) => {
  let hash = 0;

  for (const character of localUserId.trim()) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }

  const suffix = hash.toString(USERNAME_HASH_RADIX).padStart(7, "0");
  return `local-${role}-${suffix}`;
};

export class UserService {
  getAll() {
    return users;
  }

  getById(userId: string): User {
    const user = users.find((candidate) => candidate.id === userId);
    if (!user) {
      throw new HttpError(404, "USER_NOT_FOUND", "User not found");
    }
    return user;
  }

  getProfile(userId: string): UserProfile {
    const user = this.getById(userId);

    return {
      user,
      publishedLevels: levels
        .filter((level) => level.authorId === userId && level.status === "published")
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
      recentComments: comments
        .filter((comment) => comment.userId === userId)
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
        .slice(0, 5),
      stats: {
        favoriteCount: favorites.filter((favorite) => favorite.userId === userId).length,
        ratingCount: ratings.filter((rating) => rating.playerId === userId).length,
      },
    };
  }

  bindLocalUser(input: BindBackendUserInput): User {
    const username = createBoundUsername(input.role, input.localUserId);
    const existing = users.find((candidate) => candidate.username === username);
    if (existing) {
      return existing;
    }

    const sameRoleCount = users.filter((candidate) => candidate.role === input.role).length;
    const timestamp = now();
    const user: User = {
      id: `${input.role}-${sameRoleCount + 1}`,
      username,
      displayName: input.nickname,
      role: input.role,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    users.push(user);
    return user;
  }
}

export const userService = new UserService();
