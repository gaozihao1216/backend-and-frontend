import type { CreateLevelInput, Level, LevelTag, PublishedLevelsSort } from "../data/store-contracts.js";
import { levels, saveStore } from "../system/object/store.js";
import { HttpError } from "../system/api/http.js";

const now = () => new Date().toISOString();

// Service 层不直接依赖 Express，请求上下文相关的信息应在路由层先解析完。
type CreateLevelServiceInput = {
  title: CreateLevelInput["title"];
  data: CreateLevelInput["data"];
  description?: string | undefined;
  tags?: CreateLevelInput["tags"] | undefined;
};

export class LevelService {
  createLevel(authorId: string, input: CreateLevelServiceInput): Level {
    const timestamp = now();
    const level: Level = {
      id: `level-${levels.length + 1}`,
      title: input.title,
      description: input.description ?? "",
      tags: input.tags ?? [],
      data: input.data,
      authorId,
      status: "draft",
      averageRating: 0,
      ratingCount: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    levels.push(level);
    saveStore();
    return level;
  }

  getLevelById(levelId: string): Level {
    const level = levels.find((candidate) => candidate.id === levelId);
    if (!level) {
      throw new HttpError(404, "LEVEL_NOT_FOUND", "Level not found");
    }
    return level;
  }

  getPublishedLevels(options?: { tag?: LevelTag; sort?: PublishedLevelsSort }): Level[] {
    const tag = options?.tag;
    const sort = options?.sort ?? "newest";

    // 先过滤 published，再按约定的优先级排序，保证前端展示稳定。
    return levels
      .filter((level) => level.status === "published" && (tag === undefined || level.tags.includes(tag)))
      .sort((left, right) => {
        switch (sort) {
          case "highestRated":
            return (
              right.averageRating - left.averageRating ||
              right.ratingCount - left.ratingCount ||
              right.createdAt.localeCompare(left.createdAt)
            );
          case "mostRated":
            return (
              right.ratingCount - left.ratingCount ||
              right.averageRating - left.averageRating ||
              right.createdAt.localeCompare(left.createdAt)
            );
          case "newest":
          default:
            return right.createdAt.localeCompare(left.createdAt);
        }
      });
  }

  ensureLevelOwnedByDesigner(levelId: string, designerId: string): Level {
    const level = this.getLevelById(levelId);
    if (level.authorId !== designerId) {
      throw new HttpError(403, "FORBIDDEN", "Cannot submit another designer's level");
    }
    return level;
  }

  markPendingReview(levelId: string): Level {
    const level = this.getLevelById(levelId);
    if (level.status !== "draft" && level.status !== "rejected") {
      throw new HttpError(409, "INVALID_LEVEL_STATUS", "Level cannot be submitted in current status");
    }

    level.status = "pending_review";
    delete level.rejectionReason;
    level.updatedAt = now();
    saveStore();
    return level;
  }

  publishLevel(levelId: string): Level {
    const level = this.getLevelById(levelId);
    if (level.status !== "pending_review") {
      throw new HttpError(409, "INVALID_LEVEL_STATUS", "Only pending levels can be approved");
    }

    // 发布时间单独记录，便于后续做“新发布”相关排序或展示。
    const timestamp = now();
    level.status = "published";
    level.publishedAt = timestamp;
    level.updatedAt = timestamp;
    saveStore();
    return level;
  }

  rejectLevel(levelId: string, reason?: string): Level {
    const level = this.getLevelById(levelId);
    if (level.status !== "pending_review") {
      throw new HttpError(409, "INVALID_LEVEL_STATUS", "Only pending levels can be rejected");
    }

    level.status = "rejected";
    if (reason) {
      level.rejectionReason = reason;
    } else {
      delete level.rejectionReason;
    }
    level.updatedAt = now();
    saveStore();
    return level;
  }

  updateRatingSummary(levelId: string, averageRating: number, ratingCount: number): Level {
    const level = this.getLevelById(levelId);
    level.averageRating = averageRating;
    level.ratingCount = ratingCount;
    level.updatedAt = now();
    saveStore();
    return level;
  }
}

export const levelService = new LevelService();
