package microservice.admin.support.comments

import java.sql.Connection
import microservice.infrastructure.api.PlanStep
import microservice.infrastructure.api.PlanStep.Step
import microservice.infrastructure.http.HttpError
import microservice.level.objects.social.LevelComment
import microservice.level.tables.comment.CommentTable
import microservice.level.tables.shared.LevelRowMapper

/** 管理员评论删除的写结果校验。 */
object AdminCommentAccess {
  def requireDeletedComment(connection: Connection, commentId: String): Step[LevelComment] =
    PlanStep.fromEither(checkDeletedComment(connection, commentId))

  def checkDeletedComment(connection: Connection, commentId: String): Either[HttpError, LevelComment] =
    CommentTable
      .deleteById(connection, commentId)
      .map(LevelRowMapper.toComment)
      .toRight(HttpError.notFound("COMMENT_NOT_FOUND", "Comment not found"))
}
