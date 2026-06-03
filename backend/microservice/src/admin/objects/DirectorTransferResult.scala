package microservice.admin.objects

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}

final case class DirectorTransferResult(
  previousDirectorId: String,
  newDirectorId: String
)

object DirectorTransferResult {
  implicit val encoder: Encoder[DirectorTransferResult] = deriveEncoder
  implicit val decoder: Decoder[DirectorTransferResult] = deriveDecoder
}
