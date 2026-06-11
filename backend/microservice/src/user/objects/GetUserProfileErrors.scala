package microservice.user.objects

import microservice.infrastructure.http.HttpError

/** GetUserProfile 相关错误的 sealed 层次。 */
sealed trait UserApiError {
  def toHttpError: HttpError
}

object GetUserProfileErrors {

  /** 路径中的 profileUserId 在 UserTable 中不存在时返回 404。 */
  final case class UserMissing(userId: String) extends UserApiError {
    override def toHttpError: HttpError =
      HttpError.notFound("USER_NOT_FOUND", s"User not found: $userId")
  }
}
