import type { Comment, CreateCommentInput } from "../../shared/types.js";
import { comments } from "../data/store.js";
import { HttpError } from "../lib/http.js";
import { levelService } from "./level-service.js";

const now = () => new Date().toISOString();

export class CommentService {
  getCommentsForPublishedLevel(levelId: string): Comment[] {
    const level = levelService.getLevelById(levelId);
    if (level.status !== "published") {
      throw new HttpError(404, "LEVEL_NOT_FOUND", "Published level not found");
    }

    return comments
      .filter((comment) => comment.levelId === levelId)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }

  getAllComments(): Comment[] {
    return [...comments].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }

  createComment(playerId: string, levelId: string, input: CreateCommentInput): Comment {
    const level = levelService.getLevelById(levelId);
    if (level.status !== "published") {
      throw new HttpError(409, "LEVEL_NOT_PUBLISHED", "Only published levels can receive comments");
    }

    const comment: Comment = {
      id: `comment-${comments.length + 1}`,
      levelId,
      userId: playerId,
      content: input.content,
      createdAt: now(),
    };

    comments.push(comment);
    return comment;
  }

  deleteComment(commentId: string): Comment {
    const index = comments.findIndex((comment) => comment.id === commentId);
    if (index === -1) {
      throw new HttpError(404, "COMMENT_NOT_FOUND", "Comment not found");
    }

    const deleted = comments[index];
    if (!deleted) {
      throw new HttpError(404, "COMMENT_NOT_FOUND", "Comment not found");
    }

    comments.splice(index, 1);
    return deleted;
  }
}

export const commentService = new CommentService();
