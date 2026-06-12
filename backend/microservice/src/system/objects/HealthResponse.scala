package microservice.system.objects

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}

/** GET /health 的响应体；status 固定为 "ok" 表示进程存活。 */
final case class HealthResponse(
  status: String
)

object HealthResponse {
  implicit val encoder: Encoder[HealthResponse] = deriveEncoder
  implicit val decoder: Decoder[HealthResponse] = deriveDecoder
}
