package microservice.admin.api

import cats.effect.IO
import java.sql.Connection
import microservice.auth.tables.UserTable
import microservice.core.{APIWithTokenMessage, HttpError, RowMappers}
import microservice.level.objects.LevelComment
import microservice.level.tables.CommentTable
import microservice.system.objects.UserRole

final case class GetAdminCommentsAPIMessage(userId: String) extends APIWithTokenMessage[List[LevelComment]] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, List[LevelComment]]] =
    IO.pure {
      UserTable.findById(connection, userId) match {
        case Some(user) if user.role == UserRole.Admin =>
          Right(CommentTable.listAllForAdmin(connection).map(RowMappers.toComment).toList)
        case Some(_) => Left(HttpError.forbidden("Admin role is required"))
        case None => Left(HttpError.unauthorized("Unknown user"))
      }
    }
}

object GetAdminCommentsEndpoint {
  val name: String = "GetAdminComments"
  val method: String = "GET"
  val path: String = "/admin/comments"
  val businessLogic: String =
    "管理员读取全量评论，按创建时间倒序排列。"
}
