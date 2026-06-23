package microservice.level.api.design.validation

import microservice.infrastructure.api.PlanStep
import microservice.infrastructure.api.PlanStep.Step
import microservice.infrastructure.http.HttpError
import microservice.level.api.design.body.CreateLevelBody
import microservice.level.objects.errors.CreateLevelErrors

/** 创建关卡请求体字段校验。 */
object CreateLevelValidation {
  def validate(body: CreateLevelBody): Step[CreateLevelBody] =
    PlanStep.fromEither(check(body))

  def check(body: CreateLevelBody): Either[HttpError, CreateLevelBody] =
    if (body.title.trim.isEmpty) {
      Left(CreateLevelErrors.CreateLevelValidation(List("title")).toHttpError)
    } else {
      Right(body.copy(title = body.title.trim))
    }
}
