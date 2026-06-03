package microservice.admin.api

import cats.effect.IO
import java.sql.Connection
import microservice.core.{APIWithTokenMessage, AccessControl, HttpError, RowMappers}
import microservice.level.objects.LevelComment
import microservice.level.tables.CommentTable
import microservice.system.objects.AdminLevel

final case class GetAdminCommentsAPIMessage(userId: String) extends APIWithTokenMessage[List[LevelComment]] {
  override def token: String = userId

  override def plan(connection: Connection): IO[Either[HttpError, List[LevelComment]]] =
    IO.pure(
      AccessControl.requireAdminLevel(connection, userId, AdminLevel.Standard).map { _ =>
        CommentTable.listAllForAdmin(connection).map(RowMappers.toComment).toList
      }
    )
}

object GetAdminCommentsEndpoint {
  val name: String = "GetAdminComments"
  val method: String = "GET"
  val path: String = "/admin/comments"
  val businessLogic: String =
    "管理员读取全量评论，按创建时间倒序排列。"
}
