package microservice.user.api

import microservice.core.HttpError
import microservice.user.objects.UserProfile
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

sealed trait UserApiError {
  def toHttpError: HttpError
}

object UserService {
  final case class UserMissing(userId: String) extends UserApiError {
    override def toHttpError: HttpError =
      HttpError.notFound("USER_NOT_FOUND", s"User not found: $userId")
  }
}

trait UserService {
  def getUserProfile(request: GetUserProfileRequest): Either[HttpError, GetUserProfileResponse]
}

object GetUserProfileEndpoint {
  val name: String = "GetUserProfile"
  val method: String = "GET"
  val path: String = "/users/:userId/profile"
  val businessLogic: String =
    "返回公开资料页所需的用户信息、已发布关卡、最近评论和聚合统计，不暴露完整后台数据。"
}
