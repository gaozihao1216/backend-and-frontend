package microservice.level.api

import cats.effect.IO
import java.sql.Connection
import microservice.core.{APIWithTokenMessage, AccessControl, HttpError, RowMappers}
import microservice.level.objects.{Favorite, FavoriteWithLevel, Level, LevelComment, Rating}
import microservice.level.tables.{LevelTable, RatingRow, RatingTable}
import microservice.system.objects.LevelStatus
import microservice.system.objects.UserRole
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import org.http4s.EntityDecoder
import org.http4s.circe.jsonOf

final case class RateLevelRequest(
  playerId: String,
  levelId: String,
  score: Int
)

object RateLevelRequest {
  implicit val encoder: Encoder[RateLevelRequest] = deriveEncoder
  implicit val decoder: Decoder[RateLevelRequest] = deriveDecoder
}

final case class RateLevelBody(
  score: Int
)

object RateLevelBody {
  implicit val encoder: Encoder[RateLevelBody] = deriveEncoder
  implicit val decoder: Decoder[RateLevelBody] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, RateLevelBody] = jsonOf
}

final case class RateLevelResponse(
  rating: Rating
)

object RateLevelResponse {
  implicit val encoder: Encoder[RateLevelResponse] = deriveEncoder
  implicit val decoder: Decoder[RateLevelResponse] = deriveDecoder
}

final case class RateLevelAPIMessage(
  token: String,
  levelId: String,
  body: RateLevelBody
) extends APIWithTokenMessage[Rating] {
  override def plan(connection: Connection): IO[Either[HttpError, Rating]] =
    IO.pure {
      AccessControl.requireRole(token, UserRole.Player).flatMap { _ =>
        LevelTable.indexWhere(_.id == levelId) match {
        case -1 =>
          Left(PlayerRatingService.LevelMissing(levelId).toHttpError)
        case levelIndex =>
          val level = LevelTable.all(levelIndex)
          if (level.status != LevelStatus.Published) {
            Left(PlayerRatingService.LevelNotPublished(levelId).toHttpError)
          } else if (body.score < 1 || body.score > 5) {
            Left(PlayerRatingService.InvalidScore(body.score).toHttpError)
          } else {
            val timestamp = "2026-05-26T13:00:00Z"
            val existingIndex = RatingTable.indexWhere(rating => rating.levelId == levelId && rating.playerId == token)
            val ratingRow =
              if (existingIndex >= 0) {
                RatingTable.update(existingIndex, RatingTable.all(existingIndex).copy(score = body.score, updatedAt = timestamp))
              } else {
                RatingTable.insert(
                  RatingRow(
                    id = s"rating-${RatingTable.count + 1}",
                    levelId = levelId,
                    playerId = token,
                    score = body.score,
                    createdAt = timestamp,
                    updatedAt = timestamp
                  )
                )
              }

            val levelRatings = RatingTable.all.filter(_.levelId == levelId)
            val average =
              if (levelRatings.isEmpty) 0.0
              else BigDecimal(levelRatings.map(_.score).sum.toDouble / levelRatings.size).setScale(2, BigDecimal.RoundingMode.HALF_UP).toDouble
            LevelTable.update(levelIndex, level.copy(averageRating = average, ratingCount = levelRatings.size, updatedAt = timestamp))

            Right(RowMappers.toRating(ratingRow))
          }
        }
      }
    }
}

sealed trait PlayerRatingApiError {
  def toHttpError: HttpError
}

object PlayerRatingService {
  final case class LevelMissing(levelId: String) extends PlayerRatingApiError {
    override def toHttpError: HttpError =
      HttpError.notFound("LEVEL_NOT_FOUND", s"Level not found: $levelId")
  }

  final case class LevelNotPublished(levelId: String) extends PlayerRatingApiError {
    override def toHttpError: HttpError =
      HttpError.conflict("LEVEL_NOT_PUBLISHED", s"Only published levels can be rated: $levelId")
  }

  final case class InvalidScore(score: Int) extends PlayerRatingApiError {
    override def toHttpError: HttpError =
      HttpError.badRequest("INVALID_RATING_SCORE", s"score must be between 1 and 5, got $score")
  }
}

object RateLevelEndpoint {
  val name: String = "RateLevel"
  val method: String = "POST"
  val path: String = "/player/levels/:levelId/ratings"
  val businessLogic: String =
    "玩家只能给已发布关卡评分，同一玩家重复评分会覆盖旧记录，并立即回写平均分和评分人数。"
}
