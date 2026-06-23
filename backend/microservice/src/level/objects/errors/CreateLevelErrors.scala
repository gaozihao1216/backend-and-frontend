package microservice.level.objects.errors

import microservice.infrastructure.http.HttpError

/** CreateLevel API 的业务错误类型，映射为 HTTP 错误响应。 */
sealed trait CreateLevelApiError {
  def toHttpError: HttpError
}

private[level] object CreateLevelErrors {
  /** 创建关卡校验失败（如 title 为空）。 */
  final case class CreateLevelValidation(fields: List[String]) extends CreateLevelApiError {
    override def toHttpError: HttpError =
      HttpError.badRequest("CREATE_LEVEL_INVALID", "title is required", Some(fields.mkString(",")))
  }
}
