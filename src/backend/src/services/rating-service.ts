import type { CreateRatingInput, Rating } from "../system/object/store-contracts.js";
import { ratings, saveStore } from "../system/object/store.js";
import { HttpError } from "../system/api/http.js";
import { levelService } from "./level-service.js";

const now = () => new Date().toISOString();

export class RatingService {
  rateLevel(levelId: string, playerId: string, input: CreateRatingInput): Rating {
    const level = levelService.getLevelById(levelId);
    if (level.status !== "published") {
      throw new HttpError(409, "LEVEL_NOT_PUBLISHED", "Only published levels can be rated");
    }

    const timestamp = now();
    const existingRating = ratings.find(
      (rating) => rating.levelId === levelId && rating.playerId === playerId,
    );

    if (existingRating) {
      // 同一玩家对同一关卡只保留一条评分记录；再次评分视为更新而不是新增。
      existingRating.score = input.score;
      existingRating.updatedAt = timestamp;
      this.refreshLevelSummary(levelId);
      saveStore();
      return existingRating;
    }

    const rating: Rating = {
      id: `rating-${ratings.length + 1}`,
      levelId,
      playerId,
      score: input.score,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    ratings.push(rating);
    this.refreshLevelSummary(levelId);
    saveStore();
    return rating;
  }

  private refreshLevelSummary(levelId: string) {
    const levelRatings = ratings.filter((rating) => rating.levelId === levelId);
    const ratingCount = levelRatings.length;
    const total = levelRatings.reduce((sum, rating) => sum + rating.score, 0);
    // 保留两位小数，避免前端每次都自己再做一遍平均值和格式化。
    const averageRating = ratingCount === 0 ? 0 : Number((total / ratingCount).toFixed(2));

    levelService.updateRatingSummary(levelId, averageRating, ratingCount);
  }
}

export const ratingService = new RatingService();
