package microservice.system.objects

import io.circe.Encoder

final case class ApiSuccess[T](
  data: T,
  success: Boolean = true
)

object ApiSuccess {
  implicit def encoder[T: Encoder]: Encoder[ApiSuccess[T]] =
    Encoder.forProduct2("success", "data")(response => (response.success, response.data))
}
