package microservice.level.objects.social

import microservice.infrastructure.http.HttpError

/** RateLevel API 的业务错误类型，映射为 HTTP 错误响应。 */
sealed trait RateLevelApiError {
  def toHttpError: HttpError
}

object RateLevelErrors {
  /** 关卡不存在。 */
  final case class LevelMissing(levelId: String) extends RateLevelApiError {
    override def toHttpError: HttpError =
      HttpError.notFound("LEVEL_NOT_FOUND", s"Level not found: $levelId")
  }

  /** 关卡未发布，不可评分。 */
  final case class LevelNotPublished(levelId: String) extends RateLevelApiError {
    override def toHttpError: HttpError =
      HttpError.conflict("LEVEL_NOT_PUBLISHED", s"Only published levels can be rated: $levelId")
  }

  /** 评分超出 1–5 合法范围。 */
  final case class InvalidScore(score: Int) extends RateLevelApiError {
    override def toHttpError: HttpError =
      HttpError.badRequest("INVALID_RATING_SCORE", s"score must be between 1 and 5, got $score")
  }
}
