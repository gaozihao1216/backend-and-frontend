package microservice.admin.api

import cats.effect.IO
import java.sql.Connection
import microservice.infrastructure.api.{APIWithTokenMessage}
import microservice.infrastructure.http.{HttpError}
import microservice.core.{AccessControl, RowMappers}
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

