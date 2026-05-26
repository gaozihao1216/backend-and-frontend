package microservice.level

import microservice.core.{ApiEndpoint, ApiPath, POST, ValidationError}
import microservice.model.{Level, LevelData, LevelTag}

final case class CreateLevelRequest(
  designerId: String,
  title: String,
  description: String,
  tags: List[LevelTag],
  data: LevelData
)

final case class CreateLevelResponse(
  level: Level
)

sealed trait DesignerLevelApiError extends microservice.core.ApiError

final case class CreateLevelValidationError(
  override val message: String,
  invalidFields: List[String] = Nil
) extends DesignerLevelApiError {
  override val code: String = ValidationError(message, invalidFields).code
}

object CreateLevelEndpoint extends ApiEndpoint[CreateLevelRequest, CreateLevelResponse] {
  override val method = POST
  override val path = ApiPath("/designer/levels")
  override val name = "CreateLevel"
  override val description = "Create a new draft level for the current designer."

  val businessLogic: List[String] = List(
    "The route reads designerId from authentication context instead of trusting authorId from the client payload.",
    "Every newly created level starts in draft status.",
    "Rating summary starts from zero because draft levels are not yet visible to players."
  )
}

trait DesignerLevelService {
  def createLevel(
    request: CreateLevelRequest
  ): Either[DesignerLevelApiError, CreateLevelResponse]
}
