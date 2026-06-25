package microservice.user.validation

import cats.effect.IO
import microservice.infrastructure.http.HttpError
import microservice.user.objects.identity.BindBackendUserRequest
import microservice.user.objects.identity.BindBackendUserErrors

/** BindBackendUser 请求体字段校验。 */
private[user] object BindBackendUserValidation {
  /** 校验 localUserId 与 nickname 均非空。 */
  def validate(request: BindBackendUserRequest): IO[Either[HttpError, BindBackendUserRequest]] =
    IO.pure(check(request))

  /** 同步校验绑定请求体。 */
  private def check(request: BindBackendUserRequest): Either[HttpError, BindBackendUserRequest] =
    if (request.localUserId.trim.isEmpty || request.nickname.trim.isEmpty) {
      Left(BindBackendUserErrors.BindBackendUserValidation(List("localUserId", "nickname")).toHttpError)
    } else {
      Right(request)
    }
}
