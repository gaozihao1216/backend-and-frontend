package microservice.level.objects.design.request

import cats.effect.IO
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import org.http4s.EntityDecoder
import org.http4s.circe.jsonOf

/** POST /designer/submissions 的请求对象：待提交审核的关卡 ID。 */
final case class SubmitLevelRequest(
  levelId: String
)

private[level] object SubmitLevelRequest {
  implicit val encoder: Encoder[SubmitLevelRequest] = deriveEncoder
  implicit val decoder: Decoder[SubmitLevelRequest] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, SubmitLevelRequest] = jsonOf
}
