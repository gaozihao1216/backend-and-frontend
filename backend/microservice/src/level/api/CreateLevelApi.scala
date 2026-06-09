package microservice.level.api

import cats.effect.IO
import java.time.Instant
import java.sql.Connection
import microservice.infrastructure.api.{APIWithTokenMessage}
import microservice.infrastructure.http.{HttpError}
import microservice.auth.utils.AccessControl
import microservice.level.tables.shared.LevelRowMapper
import microservice.level.objects.{CreateLevelErrors, Level, LevelData}
import microservice.level.tables.level.{LevelTable}
import microservice.level.tables.shared.{LevelRow}
import microservice.system.objects.LevelStatus
import microservice.system.objects.LevelTag
import microservice.system.objects.UserRole
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import org.http4s.EntityDecoder
import org.http4s.circe.jsonOf

final case class CreateLevelBody(
  title: String,
  description: String,
  tags: List[LevelTag],
  data: LevelData
)

object CreateLevelBody {
  implicit val encoder: Encoder[CreateLevelBody] = deriveEncoder
  implicit val decoder: Decoder[CreateLevelBody] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, CreateLevelBody] = jsonOf
}

final case class CreateLevelAPIMessage(
  designerId: String,
  body: CreateLevelBody
) extends APIWithTokenMessage[Level] {
  override def token: String = designerId

  override def plan(connection: Connection): IO[Either[HttpError, Level]] =
    IO.pure {
      AccessControl.requireRole(connection, designerId, UserRole.Designer).flatMap { _ =>
        if (body.title.trim.isEmpty) {
          Left(CreateLevelErrors.CreateLevelValidation(List("title")).toHttpError)
        } else {
        val timestamp = Instant.now().toString
        val row = LevelTable.insert(
          connection,
          LevelRow(
            id = LevelTable.nextId(connection),
            title = body.title.trim,
            description = body.description,
            tags = body.tags,
            data = body.data,
            authorId = designerId,
            status = LevelStatus.Draft,
            rejectionReason = None,
            averageRating = 0,
            ratingCount = 0,
            createdAt = timestamp,
            updatedAt = timestamp,
            publishedAt = None
          )
        )
        Right(LevelRowMapper.toLevel(row))
        }
      }
    }
}
