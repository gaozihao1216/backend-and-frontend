package microservice.level.validation.design

import microservice.infrastructure.api.PlanStep
import microservice.infrastructure.api.PlanStep.Step
import microservice.infrastructure.http.HttpError
import microservice.level.body.design.CreateLevelBody
import microservice.level.objects.errors.CreateLevelErrors

/** 创建关卡请求体字段校验。 */
object CreateLevelValidation {
  /** 校验 title 非空并 trim，返回规范化 body。 */
  def validate(body: CreateLevelBody): Step[CreateLevelBody] =
    if (body.title.trim.isEmpty) {
      PlanStep.fail(CreateLevelErrors.CreateLevelValidation(List("title")).toHttpError)
    } else {
      PlanStep.succeed(body.copy(title = body.title.trim))
    }

  /** 同步校验创建关卡请求体。 */
  def check(body: CreateLevelBody): Either[HttpError, CreateLevelBody] =
    if (body.title.trim.isEmpty) {
      Left(CreateLevelErrors.CreateLevelValidation(List("title")).toHttpError)
    } else {
      Right(body.copy(title = body.title.trim))
    }
}
