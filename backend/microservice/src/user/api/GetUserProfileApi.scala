package microservice.user.api

import cats.effect.IO
import java.sql.Connection
import microservice.auth.tables.UserTable
import microservice.core.{APIWithTokenMessage, HttpError, RowMappers}
import microservice.level.tables.{CommentTable, FavoriteTable, LevelTable, RatingTable}
import microservice.system.objects.LevelStatus
import microservice.user.objects.UserProfile
import microservice.user.objects.UserProfileStats
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}

final case class GetUserProfileRequest(
  viewerUserId: String,
  userId: String
)

object GetUserProfileRequest {
  implicit val encoder: Encoder[GetUserProfileRequest] = deriveEncoder
  implicit val decoder: Decoder[GetUserProfileRequest] = deriveDecoder
}

final case class GetUserProfileResponse(
  profile: UserProfile
)

object GetUserProfileResponse {
  implicit val encoder: Encoder[GetUserProfileResponse] = deriveEncoder
  implicit val decoder: Decoder[GetUserProfileResponse] = deriveDecoder
}

final case class GetUserProfileAPIMessage(
  token: String,
  userId: String
) extends APIWithTokenMessage[UserProfile] {
  override def plan(connection: Connection): IO[Either[HttpError, UserProfile]] =
    IO.pure {
      UserTable.findById(token) match {
        case None =>
          Left(HttpError.unauthorized("Unknown user"))
        case Some(_) =>
          UserTable.findById(userId) match {
        case None =>
          Left(UserService.UserMissing(userId).toHttpError)
        case Some(user) =>
          Right(
            UserProfile(
              user = RowMappers.toBackendUser(user),
              publishedLevels = LevelTable.all
                .filter(level => level.authorId == user.id && level.status == LevelStatus.Published)
                .map(RowMappers.toLevel)
                .toList,
              recentComments = CommentTable.all
                .filter(_.userId == user.id)
                .sortBy(_.createdAt)(Ordering[String].reverse)
                .take(5)
                .map(RowMappers.toComment)
                .toList,
              stats = UserProfileStats(
                favoriteCount = FavoriteTable.all.count(_.userId == user.id),
                ratingCount = RatingTable.all.count(_.playerId == user.id)
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

object UserService {
  final case class UserMissing(userId: String) extends UserApiError {
    override def toHttpError: HttpError =
      HttpError.notFound("USER_NOT_FOUND", s"User not found: $userId")
  }
}

object GetUserProfileEndpoint {
  val name: String = "GetUserProfile"
  val method: String = "GET"
  val path: String = "/users/:userId/profile"
  val businessLogic: String =
    "返回公开资料页所需的用户信息、已发布关卡、最近评论和聚合统计，不暴露完整后台数据。"
}
