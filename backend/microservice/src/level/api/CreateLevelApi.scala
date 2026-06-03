package microservice.level.api

import cats.effect.IO
import java.time.Instant
import java.sql.Connection
import microservice.core.{APIWithTokenMessage, AccessControl, HttpError, RowMappers}
import microservice.level.objects.{Level, LevelData}
import microservice.level.tables.{LevelRow, LevelTable}
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
        Right(RowMappers.toLevel(row))
        }
      }
    }
}

object CreateLevelEndpoint {
  val name: String = "CreateLevel"
  val method: String = "POST"
  val path: String = "/designer/levels"
  val businessLogic: String =
    "从认证上下文读取 designerId，新建关卡一律从 draft 状态起步，评分统计初始化为 0。"
}
