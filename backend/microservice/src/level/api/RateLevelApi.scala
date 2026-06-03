package microservice.level.api

import cats.effect.IO
import java.sql.Connection
import java.time.Instant
import microservice.core.{APIWithTokenMessage, AccessControl, HttpError, RowMappers}
import microservice.level.objects.Rating
import microservice.level.tables.{LevelTable, RatingRow, RatingTable}
import microservice.system.objects.LevelStatus
import microservice.system.objects.UserRole
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import org.http4s.EntityDecoder
import org.http4s.circe.jsonOf

final case class RateLevelBody(
  score: Int
)

object RateLevelBody {
  implicit val encoder: Encoder[RateLevelBody] = deriveEncoder
  implicit val decoder: Decoder[RateLevelBody] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, RateLevelBody] = jsonOf
}

final case class RateLevelAPIMessage(
  playerId: String,
  levelId: String,
  body: RateLevelBody
) extends APIWithTokenMessage[Rating] {
  override def token: String = playerId

  override def plan(connection: Connection): IO[Either[HttpError, Rating]] =
    IO.pure {
      AccessControl.requireRole(connection, playerId, UserRole.Player).flatMap { _ =>
        LevelTable.findById(connection, levelId) match {
        case None =>
          Left(RateLevelErrors.LevelMissing(levelId).toHttpError)
        case Some(level) =>
          if (level.status != LevelStatus.Published) {
            Left(RateLevelErrors.LevelNotPublished(levelId).toHttpError)
          } else if (body.score < 1 || body.score > 5) {
            Left(RateLevelErrors.InvalidScore(body.score).toHttpError)
          } else {
            val timestamp = Instant.now().toString
            val ratingRow =
              RatingTable.findByLevelAndPlayer(connection, levelId, playerId) match {
                case Some(existing) =>
                  RatingTable.updateScore(connection, existing.id, body.score, timestamp).getOrElse(existing)
                case None =>
                  RatingTable.insert(
                    connection,
                  RatingRow(
                    id = RatingTable.nextId(connection),
                    levelId = levelId,
                    playerId = playerId,
                    score = body.score,
                    createdAt = timestamp,
                    updatedAt = timestamp
                  )
                )
              }

            val levelRatings = RatingTable.listByLevel(connection, levelId)
            val average =
              if (levelRatings.isEmpty) 0.0
              else BigDecimal(levelRatings.map(_.score).sum.toDouble / levelRatings.size).setScale(2, BigDecimal.RoundingMode.HALF_UP).toDouble
            LevelTable.updateRatingStats(connection, levelId, average, levelRatings.size, timestamp)

            Right(RowMappers.toRating(ratingRow))
          }
        }
      }
    }
}

