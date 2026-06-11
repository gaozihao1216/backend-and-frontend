package microservice.user.objects

import microservice.infrastructure.http.HttpError

/** BindBackendUser 相关错误的 sealed 层次，便于 APIMessage 返回 Left 时映射 HTTP 状态。 */
sealed trait BindBackendUserApiError {
  def toHttpError: HttpError
}

object BindBackendUserErrors {

  /** 请求体缺少 localUserId 或 nickname 时返回 400。 */
  final case class BindBackendUserValidation(fields: List[String]) extends BindBackendUserApiError {
    override def toHttpError: HttpError =
      HttpError.badRequest(
        "BIND_BACKEND_USER_INVALID",
        "localUserId and nickname are required",
        Some(fields.mkString(","))
      )
  }
}
