package microservice.system.api

import cats.effect.IO
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import java.sql.Connection
import microservice.infrastructure.api.{APIMessage}
import microservice.infrastructure.http.{HttpError}

final case class HealthResponse(
  status: String
)

object HealthResponse {
  implicit val encoder: Encoder[HealthResponse] = deriveEncoder
  implicit val decoder: Decoder[HealthResponse] = deriveDecoder
}

final case class HealthAPIMessage() extends APIMessage[HealthResponse] {
  override def plan(connection: Connection): IO[Either[HttpError, HealthResponse]] =
    IO.pure(Right(HealthResponse(status = "ok")))
}
