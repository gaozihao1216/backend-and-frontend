
package microservice.admin.api

import cats.effect.IO
import java.sql.Connection
import microservice.auth.tables.UserTable
import microservice.core.{APIWithTokenMessage, HttpError, RowMappers}
import microservice.level.objects.LevelComment
import microservice.level.tables.CommentTable
import microservice.system.objects.UserRole

final case class DeleteCommentAPIMessage(
  userId: String,
  commentId: String
) extends APIWithTokenMessage[LevelComment] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, LevelComment]] =
    IO.pure {
      UserTable.findById(connection, userId) match {
        case Some(user) if user.role == UserRole.Admin =>
          CommentTable.deleteById(connection, commentId)
            .map(RowMappers.toComment)
            .toRight(HttpError.notFound("COMMENT_NOT_FOUND", "Comment not found"))
        case Some(_) => Left(HttpError.forbidden("Admin role is required"))
        case None => Left(HttpError.unauthorized("Unknown user"))
      }
    }
}

object DeleteCommentEndpoint {
  val name: String = "DeleteComment"
  val method: String = "DELETE"
  val path: String = "/admin/comments/:commentId"
  val businessLogic: String =
    "管理员按 commentId 删除评论并返回被删除的评论对象。"
}
