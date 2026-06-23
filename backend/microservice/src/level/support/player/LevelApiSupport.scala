package microservice.level.support.player

import java.sql.Connection
import microservice.infrastructure.api.PlanStep
import microservice.infrastructure.api.PlanStep.Step
import microservice.infrastructure.http.HttpError
import microservice.level.objects.social.{Favorite, RateLevelErrors}
import microservice.level.tables.favorite.FavoriteTable
import microservice.level.tables.level.LevelTable
import microservice.level.tables.shared.LevelRow
import microservice.system.objects.LevelStatus

/** 关卡 API 层公共辅助：封装「已发布关卡」校验逻辑。 */
object LevelApiSupport {
  def requirePublishedLevel(connection: Connection, levelId: String): Step[LevelRow] =
    PlanStep.fromEither(checkPublishedLevel(connection, levelId))

  def requireRateableLevel(connection: Connection, levelId: String, score: Int): Step[LevelRow] =
    PlanStep.fromEither(checkRateableLevel(connection, levelId, score))

  def requireDeletedFavorite(connection: Connection, playerId: String, levelId: String): Step[Favorite] =
    PlanStep.fromEither(checkDeletedFavorite(connection, playerId, levelId))

  def checkPublishedLevel(connection: Connection, levelId: String): Either[HttpError, LevelRow] =
    LevelTable.findById(connection, levelId) match {
      case Some(level) if level.status == LevelStatus.Published => Right(level)
      case Some(_) => Left(HttpError.notFound("LEVEL_NOT_FOUND", "Published level not found"))
      case None    => Left(HttpError.notFound("LEVEL_NOT_FOUND", s"Level not found: $levelId"))
    }

  def checkRateableLevel(connection: Connection, levelId: String, score: Int): Either[HttpError, LevelRow] =
    LevelTable.findById(connection, levelId) match {
      case None =>
        Left(RateLevelErrors.LevelMissing(levelId).toHttpError)
      case Some(level) if level.status != LevelStatus.Published =>
        Left(RateLevelErrors.LevelNotPublished(levelId).toHttpError)
      case Some(level) if score < 1 || score > 5 =>
        Left(RateLevelErrors.InvalidScore(score).toHttpError)
      case Some(level) =>
        Right(level)
    }

  def checkDeletedFavorite(connection: Connection, playerId: String, levelId: String): Either[HttpError, Favorite] =
    FavoriteTable
      .delete(connection, playerId, levelId)
      .toRight(HttpError.notFound("FAVORITE_NOT_FOUND", "Favorite not found"))
}
