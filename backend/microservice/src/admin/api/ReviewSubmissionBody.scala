package microservice.admin.api

import cats.effect.IO
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import microservice.system.objects.SubmissionStatus
import org.http4s.EntityDecoder
import org.http4s.circe.jsonOf

final case class ReviewSubmissionBody(
  status: SubmissionStatus,
  reviewNote: Option[String]
)

object ReviewSubmissionBody {
  implicit val encoder: Encoder[ReviewSubmissionBody] = deriveEncoder
  implicit val decoder: Decoder[ReviewSubmissionBody] = deriveDecoder
  implicit val entityDecoder: EntityDecoder[IO, ReviewSubmissionBody] = jsonOf
}
