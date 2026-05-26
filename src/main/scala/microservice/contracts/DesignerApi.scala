package microservice.contracts

import microservice.framework.{ApiEndpoint, ApiError, ValidationError}
import microservice.framework.HttpMethod
import microservice.model.{Level, LevelData, LevelTag}

final case class CreateLevelRequest(
  designerId: String,
  title: String,
  description: String,
  tags: List[LevelTag],
  data: LevelData
)

sealed trait DesignerApiError extends ApiError

final case class CreateLevelValidationFailed(
  override val message: String,
  invalidFields: List[String] = Nil
) extends DesignerApiError {
  override val code: String = ValidationError(message, invalidFields).code
}

object DesignerApi {
  val createLevel: ApiEndpoint[CreateLevelRequest, Level, DesignerApiError] =
    ApiEndpoint(
      name = "CreateLevel",
      method = HttpMethod.Post,
      path = "/designer/levels",
      description = "Create a draft level for the authenticated designer.",
      businessRules = List(
        "Always create the new level in draft status.",
        "Fill authorId from the authenticated designer instead of trusting the client body.",
        "Initialize rating summary to zero because a draft is not yet rateable."
      )
    )
}

trait DesignerService[F[_]] {
  def createLevel(
    request: CreateLevelRequest
  ): F[Either[DesignerApiError, Level]]
}
