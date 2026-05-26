package microservice.user

import microservice.core.{ApiEndpoint, ApiPath, GET}
import microservice.model.UserProfile

final case class GetUserProfileRequest(
  viewerUserId: String,
  userId: String
)

final case class GetUserProfileResponse(
  profile: UserProfile
)

sealed trait UserApiError extends microservice.core.ApiError

final case class UserNotFound(
  override val message: String = "User not found"
) extends UserApiError {
  override val code: String = "USER_NOT_FOUND"
}

object GetUserProfileEndpoint extends ApiEndpoint[GetUserProfileRequest, GetUserProfileResponse] {
  override val method = GET
  override val path = ApiPath("/users/:userId/profile")
  override val name = "GetUserProfile"
  override val description = "Return a public user profile summary."

  val businessLogic: List[String] = List(
    "Return only published levels in the profile payload.",
    "Return the latest comments needed by the profile page instead of the whole comment history.",
    "Return aggregate favoriteCount and ratingCount as derived stats."
  )
}

trait UserService {
  def getUserProfile(
    request: GetUserProfileRequest
  ): Either[UserApiError, GetUserProfileResponse]
}
