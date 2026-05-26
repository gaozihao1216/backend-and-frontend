package microservice.contracts

import microservice.framework.{ApiEndpoint, ApiError, ValidationError}
import microservice.framework.HttpMethod
import microservice.model.{BoundBackendUser, UserRole}

final case class BindBackendUserRequest(
  localUserId: String,
  nickname: String,
  role: UserRole
)

sealed trait AuthApiError extends ApiError

final case class AuthValidationFailed(
  override val message: String,
  invalidFields: List[String] = Nil
) extends AuthApiError {
  override val code: String = ValidationError(message, invalidFields).code
}

object AuthApi {
  val bindBackendUser: ApiEndpoint[BindBackendUserRequest, BoundBackendUser, AuthApiError] =
    ApiEndpoint(
      name = "BindBackendUser",
      method = HttpMethod.Post,
      path = "/auth/bind",
      description = "Bind a frontend local identity to a backend user record.",
      businessRules = List(
        "Reuse an existing backend user when localUserId and role map to the same deterministic username.",
        "Create a new user only when no existing binding matches the local identity."
      )
    )
}

trait AuthService[F[_]] {
  def bindBackendUser(
    request: BindBackendUserRequest
  ): F[Either[AuthApiError, BoundBackendUser]]
}
