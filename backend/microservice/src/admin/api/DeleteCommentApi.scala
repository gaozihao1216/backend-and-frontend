
package microservice.admin.api

import cats.effect.IO
import java.sql.Connection
import microservice.infrastructure.api.{APIWithTokenMessage}
import microservice.infrastructure.http.{HttpError}
import microservice.auth.utils.AccessControl
import microservice.level.tables.LevelRowMapper
import microservice.level.objects.LevelComment
import microservice.level.tables.CommentTable
import microservice.system.objects.AdminLevel

final case class DeleteCommentAPIMessage(
  userId: String,
  commentId: String
) extends APIWithTokenMessage[LevelComment] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, LevelComment]] =
    IO.pure(
      AccessControl.requireAdminLevel(connection, userId, AdminLevel.Standard).flatMap { _ =>
        CommentTable.deleteById(connection, commentId)
          .map(LevelRowMapper.toComment)
          .toRight(HttpError.notFound("COMMENT_NOT_FOUND", "Comment not found"))
      }
    )
}
