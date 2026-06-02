package microservice.level.api

import cats.effect.IO
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import microservice.level.objects.Submission
import org.http4s.EntityDecoder
import org.http4s.circe.jsonOf

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

object SubmitLevelEndpoint {
  val name: String = "SubmitLevel"
  val method: String = "POST"
  val path: String = "/designer/submissions"
  val businessLogic: String =
    "设计师提交自己的 draft/rejected 关卡进入 pending_review 状态，并生成待审核 submission。"
}
