package microservice.level.api

import cats.effect.IO
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import org.http4s.EntityDecoder
import org.http4s.circe.jsonOf

final case class CreateCommentBody(
  content: String
)

object CreateCommentBody {
  implicit val encoder: Encoder[CreateCommentBody] = deriveEncoder
  implicit val decoder: Decoder[CreateCommentBody] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, CreateCommentBody] = jsonOf
}
