package microservice.level.api

import cats.effect.IO
import java.sql.Connection
import microservice.infrastructure.api.{APIWithTokenMessage}
import microservice.infrastructure.http.{HttpError}
import microservice.auth.utils.AccessControl
import microservice.level.tables.LevelRowMapper
import microservice.level.objects.Level
import microservice.level.utils.LevelApiSupport
import microservice.system.objects.UserRole

final case class GetPublishedLevelAPIMessage(
  playerId: String,
  levelId: String
) extends APIWithTokenMessage[Level] {
  override def token: String = playerId

  override def plan(connection: Connection): IO[Either[HttpError, Level]] =
    IO.pure(
      AccessControl.requireRole(connection, playerId, UserRole.Player)
        .flatMap(_ => LevelApiSupport.publishedLevel(connection, levelId).map(LevelRowMapper.toLevel))
    )
}
