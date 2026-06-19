package microservice.level.api.player.read

import cats.effect.IO
import java.sql.Connection
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.user.utils.AccessControl
import microservice.level.tables.shared.LevelRowMapper
import microservice.level.objects.level.Level
import microservice.level.tables.level.LevelTable
import microservice.system.objects.LevelTag
import microservice.system.objects.UserRole

final case class GetPublishedLevelsAPIMessage(
  playerId: String,
  tag: Option[LevelTag],
  sort: String
) extends APIWithTokenMessage[List[Level]] {
  override def token: String = playerId

  override def plan(connection: Connection): IO[Either[HttpError, List[Level]]] =
    PlanSteps.finish {
      for {
        _ <- PlanSteps.require(AccessControl.requireRole(connection, playerId, UserRole.Player).map(_ => ()))
        levels <- PlanSteps.read(LevelTable.listPublished(connection, tag, sort).map(LevelRowMapper.toLevel).toList)
      } yield levels
    }
}
