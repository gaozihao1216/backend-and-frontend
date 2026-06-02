package microservice.system.objects

import io.circe.Encoder

final case class ErrorBody(
  code: String,
  message: String,
  details: Option[String]
)

object ErrorBody {
  implicit val encoder: Encoder[ErrorBody] =
    Encoder.forProduct3("code", "message", "details")(error => (error.code, error.message, error.details))
}
