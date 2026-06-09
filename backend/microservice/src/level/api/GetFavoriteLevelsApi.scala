package microservice.level.api

import cats.effect.IO
import java.sql.Connection
import microservice.infrastructure.api.{APIWithTokenMessage}
import microservice.infrastructure.http.{HttpError}
import microservice.auth.utils.AccessControl
import microservice.level.tables.shared.LevelRowMapper
import microservice.level.objects.FavoriteWithLevel
import microservice.level.tables.favorite.FavoriteTable
import microservice.system.objects.UserRole

final case class GetFavoriteLevelsAPIMessage(
  playerId: String
) extends APIWithTokenMessage[List[FavoriteWithLevel]] {
  override def token: String = playerId

  override def plan(connection: Connection): IO[Either[HttpError, List[FavoriteWithLevel]]] =
    IO.pure(
      AccessControl.requireRole(connection, playerId, UserRole.Player).map(_ =>
        FavoriteTable.listPublishedByUser(connection, playerId)
          .map { case (favorite, level) => FavoriteWithLevel.from(favorite, LevelRowMapper.toLevel(level)) }
          .toList
      )
    )
}
