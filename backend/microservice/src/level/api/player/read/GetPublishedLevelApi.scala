package microservice.level.api.player.read

import cats.effect.IO
import java.sql.Connection
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.user.utils.AccessControl
import microservice.level.tables.shared.LevelRowMapper
import microservice.level.objects.level.Level
import microservice.level.support.player.LevelApiSupport
import microservice.system.objects.UserRole

final case class GetPublishedLevelAPIMessage(
  playerId: String,
  levelId: String
) extends APIWithTokenMessage[Level] {
  override def token: String = playerId

  override def plan(connection: Connection): IO[Either[HttpError, Level]] =
    PlanSteps.finish {
      for {
        _ <- PlanSteps.require(AccessControl.requireRole(connection, playerId, UserRole.Player).map(_ => ()))
        levelRow <- PlanSteps.require(LevelApiSupport.publishedLevel(connection, levelId))
      } yield LevelRowMapper.toLevel(levelRow)
    }
}
