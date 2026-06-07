package microservice.bird.objects

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import microservice.system.objects.SubmissionStatus

final case class BirdSubmission(
  id: String,
  birdDesignId: String,
  submitterId: String,
  status: SubmissionStatus,
  reviewerId: Option[String],
  reviewNote: Option[String],
  submittedAt: String,
  reviewedAt: Option[String]
)

object BirdSubmission {
  implicit val encoder: Encoder[BirdSubmission] = deriveEncoder
  implicit val decoder: Decoder[BirdSubmission] = deriveDecoder
}
