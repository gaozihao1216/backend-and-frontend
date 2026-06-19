package microservice.user.objects

import microservice.infrastructure.http.HttpError

/** GetUserProfile 业务错误的 sealed 层次。
  *
  * 定义：UserApiError trait + GetUserProfileErrors.UserMissing case。
  * 问题：路径 userId 不存在时不应返回 500 或空壳 profile。
  * 作用：UserMissing.toHttpError → 404 USER_NOT_FOUND。
  * 关联：[[GetUserProfileAPIMessage]] 第二步校验 profileUserId。
  */
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
