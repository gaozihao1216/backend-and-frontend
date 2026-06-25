package microservice.user.objects.identity

import microservice.infrastructure.http.HttpError

/** BindBackendUser 业务错误的 sealed 层次。
  *
  * 定义：BindBackendUserApiError trait + BindBackendUserErrors 伴生 object 承载具体 case。
  * 问题：校验失败需稳定错误码 BIND_BACKEND_USER_INVALID 供前端展示。
  * 作用：toHttpError 映射为 400 + 字段列表 details。
  * 关联：[[BindBackendUserAPIMessage]]、[[BindBackendUserValidation.check]] Left 分支。
  */
sealed trait BindBackendUserApiError {
  def toHttpError: HttpError
}

private[user] object BindBackendUserErrors {

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
