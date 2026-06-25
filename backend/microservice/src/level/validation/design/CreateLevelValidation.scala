package microservice.level.validation.design

import cats.effect.IO
import microservice.infrastructure.http.HttpError
import microservice.level.objects.design.request.CreateLevelRequest
import microservice.level.objects.errors.CreateLevelErrors

/** 创建关卡请求体字段校验。 */
private[level] object CreateLevelValidation {
  /** 校验 title 非空并 trim，返回规范化 body。 */
  def validate(body: CreateLevelRequest): IO[Either[HttpError, CreateLevelRequest]] =
    IO.pure(check(body))

  /** 同步校验创建关卡请求体。 */
  private def check(body: CreateLevelRequest): Either[HttpError, CreateLevelRequest] =
    if (body.title.trim.isEmpty) {
      Left(CreateLevelErrors.CreateLevelValidation(List("title")).toHttpError)
    } else {
      Right(body.copy(title = body.title.trim))
    }
}
