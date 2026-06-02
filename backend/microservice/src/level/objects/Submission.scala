package microservice.level.objects

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import microservice.system.objects.SubmissionStatus

final case class Submission(
  id: String,
  levelId: String,
  submitterId: String,
  status: SubmissionStatus,
  reviewerId: Option[String],
  reviewNote: Option[String],
  submittedAt: String,
  reviewedAt: Option[String]
)

object Submission {
  implicit val encoder: Encoder[Submission] = deriveEncoder
  implicit val decoder: Decoder[Submission] = deriveDecoder
}
