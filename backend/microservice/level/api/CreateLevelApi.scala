package microservice.level.api

import cats.effect.IO
import microservice.core.HttpError
import microservice.level.objects.{Level, LevelData, Submission}
import microservice.system.objects.LevelTag
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

final case class SubmitLevelBody(
  levelId: String
)

object SubmitLevelBody {
  implicit val encoder: Encoder[SubmitLevelBody] = deriveEncoder
  implicit val decoder: Decoder[SubmitLevelBody] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, SubmitLevelBody] = jsonOf
}

final case class SubmitLevelRequest(
  designerId: String,
  levelId: String
)

object SubmitLevelRequest {
  implicit val encoder: Encoder[SubmitLevelRequest] = deriveEncoder
  implicit val decoder: Decoder[SubmitLevelRequest] = deriveDecoder
}

final case class SubmitLevelResponse(
  submission: Submission
)

object SubmitLevelResponse {
  implicit val encoder: Encoder[SubmitLevelResponse] = deriveEncoder
  implicit val decoder: Decoder[SubmitLevelResponse] = deriveDecoder
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

trait DesignerLevelService {
  def createLevel(request: CreateLevelRequest): Either[HttpError, CreateLevelResponse]
  def submitLevel(request: SubmitLevelRequest): Either[HttpError, SubmitLevelResponse]
}

object CreateLevelEndpoint {
  val name: String = "CreateLevel"
  val method: String = "POST"
  val path: String = "/designer/levels"
  val businessLogic: String =
    "从认证上下文读取 designerId，新建关卡一律从 draft 状态起步，评分统计初始化为 0。"
}
