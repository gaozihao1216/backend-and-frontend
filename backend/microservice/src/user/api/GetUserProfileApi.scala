package microservice.user.api

import cats.effect.IO
import java.sql.Connection
import microservice.auth.tables.UserTable
import microservice.infrastructure.api.{APIWithTokenMessage}
import microservice.infrastructure.http.{HttpError}
import microservice.core.{RowMappers}
import microservice.level.tables.{CommentTable, FavoriteTable, LevelTable, RatingTable}
import microservice.user.objects.UserProfile
import microservice.user.objects.UserProfileStats

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
              user = RowMappers.toBackendUser(user),
              publishedLevels = LevelTable.listPublishedByAuthor(connection, user.id)
                .map(RowMappers.toLevel)
                .toList,
              recentComments = CommentTable.listRecentByUser(connection, user.id, limit = 5)
                .map(RowMappers.toComment)
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

sealed trait UserApiError {
  def toHttpError: HttpError
}

object GetUserProfileErrors {
  final case class UserMissing(userId: String) extends UserApiError {
    override def toHttpError: HttpError =
      HttpError.notFound("USER_NOT_FOUND", s"User not found: $userId")
  }
}

