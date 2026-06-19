package microservice.admin.api.comments

import cats.effect.IO
import java.sql.Connection
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.user.utils.AccessControl
import microservice.level.tables.shared.LevelRowMapper
import microservice.level.objects.LevelComment
import microservice.level.tables.comment.CommentTable
import microservice.system.objects.AdminLevel

/** 按 ID 删除单条关卡评论。 */
final case class DeleteCommentAPIMessage(
  userId: String,
  commentId: String
) extends APIWithTokenMessage[LevelComment] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, LevelComment]] =
    PlanSteps.finish {
      for {
        _ <- PlanSteps.require(AccessControl.requireAdminLevel(connection, userId, AdminLevel.Standard).map(_ => ()))
        comment <- PlanSteps.require(
          CommentTable.deleteById(connection, commentId)
            .map(LevelRowMapper.toComment)
            .toRight(HttpError.notFound("COMMENT_NOT_FOUND", "Comment not found"))
        )
      } yield comment
    }
}
