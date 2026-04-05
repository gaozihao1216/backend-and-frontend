import type { CreateRatingInput, Rating } from "../../shared/types.js";
import { ratings } from "../data/store.js";
import { HttpError } from "../lib/http.js";
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
      existingRating.score = input.score;
      existingRating.updatedAt = timestamp;
      this.refreshLevelSummary(levelId);
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
    return rating;
  }

  private refreshLevelSummary(levelId: string) {
    const levelRatings = ratings.filter((rating) => rating.levelId === levelId);
    const ratingCount = levelRatings.length;
    const total = levelRatings.reduce((sum, rating) => sum + rating.score, 0);
    const averageRating = ratingCount === 0 ? 0 : Number((total / ratingCount).toFixed(2));

    levelService.updateRatingSummary(levelId, averageRating, ratingCount);
  }
}

export const ratingService = new RatingService();
