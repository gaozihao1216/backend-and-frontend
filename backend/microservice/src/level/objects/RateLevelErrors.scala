package microservice.level.objects

import microservice.infrastructure.http.HttpError

sealed trait RateLevelApiError {
  def toHttpError: HttpError
}

object RateLevelErrors {
  final case class LevelMissing(levelId: String) extends RateLevelApiError {
    override def toHttpError: HttpError =
      HttpError.notFound("LEVEL_NOT_FOUND", s"Level not found: $levelId")
  }

  final case class LevelNotPublished(levelId: String) extends RateLevelApiError {
    override def toHttpError: HttpError =
      HttpError.conflict("LEVEL_NOT_PUBLISHED", s"Only published levels can be rated: $levelId")
  }

  final case class InvalidScore(score: Int) extends RateLevelApiError {
    override def toHttpError: HttpError =
      HttpError.badRequest("INVALID_RATING_SCORE", s"score must be between 1 and 5, got $score")
  }
}
