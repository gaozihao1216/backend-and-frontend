import { z } from "zod";
import { APIMessage } from "../../../../../system/api/APIMessage.js";

/** Mirrors backend internal API level/api/internal/admin/comments/DeleteCommentInternalApi.scala; not registered as a public frontend route. */
export class DeleteCommentInternalAPI extends APIMessage<unknown> {
  readonly commentId: unknown;
  constructor(commentId: unknown) {
    super();
    this.commentId = commentId;
  }

  override get responseSchema() {
    return z.unknown();
  }
}
