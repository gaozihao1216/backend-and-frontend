package microservice.user.objects

import microservice.infrastructure.http.HttpError

sealed trait UserApiError {
  def toHttpError: HttpError
}

object GetUserProfileErrors {
  final case class UserMissing(userId: String) extends UserApiError {
    override def toHttpError: HttpError =
      HttpError.notFound("USER_NOT_FOUND", s"User not found: $userId")
  }
}
