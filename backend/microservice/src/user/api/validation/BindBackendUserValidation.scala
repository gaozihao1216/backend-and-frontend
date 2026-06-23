package microservice.user.api.validation

import microservice.infrastructure.api.PlanStep
import microservice.infrastructure.api.PlanStep.Step
import microservice.infrastructure.http.HttpError
import microservice.user.api.BindBackendUserRequest
import microservice.user.objects.BindBackendUserErrors

/** BindBackendUser 请求体字段校验。 */
object BindBackendUserValidation {
  def validate(request: BindBackendUserRequest): Step[BindBackendUserRequest] =
    PlanStep.fromEither(check(request))

  def check(request: BindBackendUserRequest): Either[HttpError, BindBackendUserRequest] =
    if (request.localUserId.trim.isEmpty || request.nickname.trim.isEmpty) {
      Left(BindBackendUserErrors.BindBackendUserValidation(List("localUserId", "nickname")).toHttpError)
    } else {
      Right(request)
    }
}
