package microservice.level.body.design

import cats.effect.IO
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import org.http4s.EntityDecoder
import org.http4s.circe.jsonOf

/** POST /designer/submissions 的请求体：待提交审核的关卡 ID。 */
final case class SubmitLevelBody(
  levelId: String
)

object SubmitLevelBody {
  implicit val encoder: Encoder[SubmitLevelBody] = deriveEncoder
  implicit val decoder: Decoder[SubmitLevelBody] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, SubmitLevelBody] = jsonOf
}
