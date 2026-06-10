package microservice.user.api

import cats.effect.IO
import java.sql.Connection
import microservice.user.tables.user.{UserRowMapper, UserTable}
import microservice.infrastructure.api.{APIWithTokenMessage}
import microservice.infrastructure.http.{HttpError}
import microservice.level.tables.comment.{CommentTable}
import microservice.level.tables.favorite.{FavoriteTable}
import microservice.level.tables.level.{LevelTable}
import microservice.level.tables.rating.{RatingTable}
import microservice.level.tables.shared.{LevelRowMapper}
import microservice.user.objects.{GetUserProfileErrors, UserProfile, UserProfileStats}

final case class GetUserProfileAPIMessage(
  viewerUserId: String,
  profileUserId: String
) extends APIWithTokenMessage[UserProfile] {
  override def token: String = viewerUserId

  override def plan(connection: Connection): IO[Either[HttpError, UserProfile]] =
    IO.pure {
      UserTable.findById(connection, viewerUserId) match {
        case None =>
          Left(HttpError.unauthorized("Unknown user"))
        case Some(_) =>
          UserTable.findById(connection, profileUserId) match {
        case None =>
          Left(GetUserProfileErrors.UserMissing(profileUserId).toHttpError)
        case Some(user) =>
          Right(
            UserProfile(
              user = UserRowMapper.toBackendUser(user),
              publishedLevels = LevelTable.listPublishedByAuthor(connection, user.id)
                .map(LevelRowMapper.toLevel)
                .toList,
              recentComments = CommentTable.listRecentByUser(connection, user.id, limit = 5)
                .map(LevelRowMapper.toComment)
                .toList,
              stats = UserProfileStats(
                favoriteCount = FavoriteTable.countByUser(connection, user.id),
                ratingCount = RatingTable.countByPlayer(connection, user.id)
              )
            )
          )
          }
      }
    }
}

