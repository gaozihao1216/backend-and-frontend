package microservice.level.api

import cats.effect.IO
import java.sql.Connection
import microservice.infrastructure.api.{APIWithTokenMessage, PlanSteps}
import microservice.infrastructure.http.HttpError
import microservice.user.utils.AccessControl
import microservice.level.objects.Favorite
import microservice.level.tables.favorite.FavoriteTable
import microservice.level.utils.LevelApiSupport
import microservice.system.objects.UserRole

final case class UnfavoriteLevelAPIMessage(
  playerId: String,
  levelId: String
) extends APIWithTokenMessage[Favorite] {
  override def token: String = playerId

  override def plan(connection: Connection): IO[Either[HttpError, Favorite]] =
    PlanSteps.finish {
      for {
        _ <- PlanSteps.require(AccessControl.requireRole(connection, playerId, UserRole.Player).map(_ => ()))
        _ <- PlanSteps.require(LevelApiSupport.publishedLevel(connection, levelId).map(_ => ()))
        favorite <- PlanSteps.require(
          FavoriteTable
            .delete(connection, playerId, levelId)
            .toRight(HttpError.notFound("FAVORITE_NOT_FOUND", "Favorite not found"))
        )
      } yield favorite
    }
}
