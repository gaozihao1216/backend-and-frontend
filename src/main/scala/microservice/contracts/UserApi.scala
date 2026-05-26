package microservice.contracts

import microservice.framework.{ApiEndpoint, ApiError, NotFoundError}
import microservice.framework.HttpMethod
import microservice.model.UserProfile

final case class GetUserProfileRequest(
  viewerUserId: String,
  userId: String
)

sealed trait UserApiError extends ApiError

final case class UserNotFound(
  override val message: String = "User not found"
) extends UserApiError {
  override val code: String = NotFoundError("USER_NOT_FOUND", message).code
}

object UserApi {
  val getUserProfile: ApiEndpoint[GetUserProfileRequest, UserProfile, UserApiError] =
    ApiEndpoint(
      name = "GetUserProfile",
      method = HttpMethod.Get,
      path = "/users/:userId/profile",
      description = "Fetch one user's public profile summary.",
      businessRules = List(
        "Return only published levels in the profile payload.",
        "Return only the latest five comments for the profile view.",
        "Compute favoriteCount and ratingCount as summary stats instead of exposing raw tables."
      )
    )
}

trait UserService[F[_]] {
  def getUserProfile(
    request: GetUserProfileRequest
  ): F[Either[UserApiError, UserProfile]]
}
