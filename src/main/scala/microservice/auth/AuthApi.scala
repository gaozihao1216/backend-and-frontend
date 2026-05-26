package microservice.auth

import microservice.core.{ApiEndpoint, ApiPath, ValidationError, POST}
import microservice.model.{BoundBackendUser, UserRole}

final case class BindBackendUserRequest(
  localUserId: String,
  nickname: String,
  role: UserRole
)

final case class BindBackendUserResponse(
  user: BoundBackendUser
)

sealed trait AuthApiError extends microservice.core.ApiError

final case class BindBackendUserValidationError(
  override val message: String,
  invalidFields: List[String] = Nil
) extends AuthApiError {
  override val code: String = ValidationError(message, invalidFields).code
}

object BindBackendUserEndpoint extends ApiEndpoint[BindBackendUserRequest, BindBackendUserResponse] {
  override val method = POST
  override val path = ApiPath("/auth/bind")
  override val name = "BindBackendUser"
  override val description = "Bind a frontend local identity to one backend user."

  val businessLogic: List[String] = List(
    "Reuse the existing backend user when localUserId and role map to the same deterministic username.",
    "Create a new user only when no existing binding can be reused."
  )
}

trait AuthService {
  def bindBackendUser(
    request: BindBackendUserRequest
  ): Either[AuthApiError, BindBackendUserResponse]
}
