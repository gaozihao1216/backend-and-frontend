import type { Favorite } from "../../shared/types.js";
import { favorites, saveStore } from "../data/store.js";
import { HttpError } from "../lib/http.js";
import { levelService } from "./level-service.js";

const now = () => new Date().toISOString();

export class FavoriteService {
  getFavoritesForUser(userId: string): Favorite[] {
    return favorites
      // 收藏列表也按时间倒序返回，方便展示最近收藏。
      .filter((favorite) => favorite.userId === userId)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }

  addFavorite(userId: string, levelId: string): Favorite {
    const level = levelService.getLevelById(levelId);
    if (level.status !== "published") {
      throw new HttpError(409, "LEVEL_NOT_PUBLISHED", "Only published levels can be favorited");
    }

    const existing = favorites.find(
      (favorite) => favorite.userId === userId && favorite.levelId === levelId,
    );
    if (existing) {
      // 重复收藏不报错，直接返回已有记录，保持接口幂等。
      return existing;
    }

    const favorite: Favorite = {
      id: `favorite-${favorites.length + 1}`,
      levelId,
      userId,
      createdAt: now(),
    };

    favorites.push(favorite);
    saveStore();
    return favorite;
  }

  removeFavorite(userId: string, levelId: string): Favorite {
    const level = levelService.getLevelById(levelId);
    if (level.status !== "published") {
      throw new HttpError(404, "LEVEL_NOT_FOUND", "Published level not found");
    }

    const index = favorites.findIndex(
      (favorite) => favorite.userId === userId && favorite.levelId === levelId,
    );
    if (index === -1) {
      throw new HttpError(404, "FAVORITE_NOT_FOUND", "Favorite not found");
    }

    const deleted = favorites[index];
    if (!deleted) {
      throw new HttpError(404, "FAVORITE_NOT_FOUND", "Favorite not found");
    }

    favorites.splice(index, 1);
    saveStore();
    return deleted;
  }
}

export const favoriteService = new FavoriteService();
