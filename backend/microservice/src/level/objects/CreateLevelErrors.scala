package microservice.level.objects

import microservice.infrastructure.http.HttpError

sealed trait CreateLevelApiError {
  def toHttpError: HttpError
}

object CreateLevelErrors {
  final case class CreateLevelValidation(fields: List[String]) extends CreateLevelApiError {
    override def toHttpError: HttpError =
      HttpError.badRequest("CREATE_LEVEL_INVALID", "title is required", Some(fields.mkString(",")))
  }
}
