package microservice.bird.api

import cats.effect.IO
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import microservice.system.objects.SubmissionStatus
import org.http4s.EntityDecoder
import org.http4s.circe.jsonOf

final case class ReviewBirdSubmissionBody(
  status: SubmissionStatus,
  reviewNote: Option[String]
)

object ReviewBirdSubmissionBody {
  implicit val encoder: Encoder[ReviewBirdSubmissionBody] = deriveEncoder
  implicit val decoder: Decoder[ReviewBirdSubmissionBody] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, ReviewBirdSubmissionBody] = jsonOf
}
