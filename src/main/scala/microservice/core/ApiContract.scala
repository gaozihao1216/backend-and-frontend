package microservice.core

final case class ApiPath(value: String) extends AnyVal

sealed trait ApiError {
  def code: String
  def message: String
}

final case class ValidationError(
  message: String,
  fields: List[String] = Nil
) extends ApiError {
  override val code: String = "VALIDATION_ERROR"
}

final case class NotFoundError(
  code: String,
  message: String
) extends ApiError

final case class UnauthorizedError(
  message: String
) extends ApiError {
  override val code: String = "UNAUTHORIZED"
}

final case class ConflictError(
  code: String,
  message: String
) extends ApiError

final case class ForbiddenError(
  message: String
) extends ApiError {
  override val code: String = "FORBIDDEN"
}

trait ApiEndpoint[Req, Res] {
  def method: HttpMethod
  def path: ApiPath
  def name: String
  def description: String
}

trait ApiHandler[Req, Res] {
  def handle(request: Req): Either[ApiError, Res]
}
