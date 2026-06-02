package microservice.auth.utils

import microservice.core.HttpError

sealed trait AuthError {
  def toHttpError: HttpError
}

object AuthService {
  final case class BindBackendUserValidation(fields: List[String]) extends AuthError {
    override def toHttpError: HttpError =
      HttpError.badRequest("BIND_BACKEND_USER_INVALID", "localUserId and nickname are required", Some(fields.mkString(",")))
  }
}
