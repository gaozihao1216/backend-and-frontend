package microservice.level.api

import cats.effect.IO
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

final case class CreateLevelRequest(
  designerId: String,
  title: String,
  description: String,
  tags: List[LevelTag],
  data: LevelData
)

object CreateLevelRequest {
  implicit val encoder: Encoder[CreateLevelRequest] = deriveEncoder
  implicit val decoder: Decoder[CreateLevelRequest] = deriveDecoder
}

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

final case class CreateLevelResponse(
  level: Level
)

object CreateLevelResponse {
  implicit val encoder: Encoder[CreateLevelResponse] = deriveEncoder
  implicit val decoder: Decoder[CreateLevelResponse] = deriveDecoder
}

final case class CreateLevelAPIMessage(
  token: String,
  body: CreateLevelBody
) extends APIWithTokenMessage[Level] {
  override def plan(connection: Connection): IO[Either[HttpError, Level]] =
    IO.pure {
      AccessControl.requireRole(token, UserRole.Designer).flatMap { _ =>
        if (body.title.trim.isEmpty) {
          Left(DesignerLevelService.CreateLevelValidation(List("title")).toHttpError)
        } else {
        val timestamp = "2026-05-26T12:00:00Z"
        val row = LevelTable.insert(
          LevelRow(
            id = s"level-${LevelTable.count + 1}",
            title = body.title.trim,
            description = body.description,
            tags = body.tags,
            data = body.data,
            authorId = token,
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

sealed trait DesignerLevelApiError {
  def toHttpError: HttpError
}

object DesignerLevelService {
  final case class CreateLevelValidation(fields: List[String]) extends DesignerLevelApiError {
    override def toHttpError: HttpError =
      HttpError.badRequest("CREATE_LEVEL_INVALID", "title is required", Some(fields.mkString(",")))
  }
}

object CreateLevelEndpoint {
  val name: String = "CreateLevel"
  val method: String = "POST"
  val path: String = "/designer/levels"
  val businessLogic: String =
    "从认证上下文读取 designerId，新建关卡一律从 draft 状态起步，评分统计初始化为 0。"
}
