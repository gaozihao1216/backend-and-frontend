package microservice.level.api

import cats.effect.IO
import java.sql.Connection
import java.time.Instant
import microservice.infrastructure.api.{APIWithTokenMessage}
import microservice.infrastructure.http.{HttpError}
import microservice.auth.utils.AccessControl
import microservice.level.objects.Favorite
import microservice.level.tables.favorite.FavoriteTable
import microservice.level.utils.LevelApiSupport
import microservice.system.objects.UserRole

final case class FavoriteLevelAPIMessage(
  playerId: String,
  levelId: String
) extends APIWithTokenMessage[Favorite] {
  override def token: String = playerId

  override def plan(connection: Connection): IO[Either[HttpError, Favorite]] =
    IO.pure(
      AccessControl.requireRole(connection, playerId, UserRole.Player).flatMap(_ => LevelApiSupport.publishedLevel(connection, levelId).map { _ =>
        FavoriteTable.find(connection, playerId, levelId).getOrElse {
          FavoriteTable.insert(
            connection,
            Favorite(
              id = FavoriteTable.nextId(connection),
              levelId = levelId,
              userId = playerId,
              createdAt = Instant.now().toString
            )
          )
        }
      })
    )
}
