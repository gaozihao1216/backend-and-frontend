package microservice.level.api

import cats.effect.IO
import java.sql.Connection
import microservice.infrastructure.api.{APIWithTokenMessage}
import microservice.infrastructure.http.{HttpError}
import microservice.core.{AccessControl, RowMappers}
import microservice.level.objects.Level
import microservice.level.tables.LevelTable
import microservice.system.objects.LevelTag
import microservice.system.objects.UserRole

final case class GetPublishedLevelsAPIMessage(
  playerId: String,
  tag: Option[LevelTag],
  sort: String
) extends APIWithTokenMessage[List[Level]] {
  override def token: String = playerId

  override def plan(connection: Connection): IO[Either[HttpError, List[Level]]] =
    IO.pure {
      AccessControl.requireRole(connection, playerId, UserRole.Player).map { _ =>
        LevelTable.listPublished(connection, tag, sort).map(RowMappers.toLevel).toList
      }
    }
}

