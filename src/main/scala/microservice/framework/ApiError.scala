package microservice.framework

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

final case class ConflictError(
  code: String,
  message: String
) extends ApiError

final case class ForbiddenError(
  message: String
) extends ApiError {
  override val code: String = "FORBIDDEN"
}
