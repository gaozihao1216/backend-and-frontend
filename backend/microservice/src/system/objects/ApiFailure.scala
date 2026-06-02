package microservice.system.objects

import io.circe.Encoder

final case class ApiFailure(
  success: Boolean = false,
  error: ErrorBody
)

object ApiFailure {
  implicit val encoder: Encoder[ApiFailure] =
    Encoder.forProduct2("success", "error")(failure => (failure.success, failure.error))
}
