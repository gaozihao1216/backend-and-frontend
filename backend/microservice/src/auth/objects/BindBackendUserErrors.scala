package microservice.auth.objects

import microservice.infrastructure.http.HttpError

sealed trait BindBackendUserApiError {
  def toHttpError: HttpError
}

object BindBackendUserErrors {
  final case class BindBackendUserValidation(fields: List[String]) extends BindBackendUserApiError {
    override def toHttpError: HttpError =
      HttpError.badRequest("BIND_BACKEND_USER_INVALID", "localUserId and nickname are required", Some(fields.mkString(",")))
  }
}
