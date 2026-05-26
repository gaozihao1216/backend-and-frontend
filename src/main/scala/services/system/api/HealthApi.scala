package coursebackend.services.system.api

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}

final case class HealthResponse(
  status: String
)

object HealthResponse {
  implicit val encoder: Encoder[HealthResponse] = deriveEncoder
  implicit val decoder: Decoder[HealthResponse] = deriveDecoder
}
