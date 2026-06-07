package microservice.bird.objects

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import microservice.system.objects.SubmissionStatus

final case class BirdSubmissionWithDesign(
  id: String,
  birdDesignId: String,
  submitterId: String,
  status: SubmissionStatus,
  reviewerId: Option[String],
  reviewNote: Option[String],
  submittedAt: String,
  reviewedAt: Option[String],
  design: BirdDesign
)

object BirdSubmissionWithDesign {
  def from(submission: BirdSubmission, design: BirdDesign): BirdSubmissionWithDesign =
    BirdSubmissionWithDesign(
      submission.id,
      submission.birdDesignId,
      submission.submitterId,
      submission.status,
      submission.reviewerId,
      submission.reviewNote,
      submission.submittedAt,
      submission.reviewedAt,
      design
    )

  implicit val encoder: Encoder[BirdSubmissionWithDesign] = deriveEncoder
  implicit val decoder: Decoder[BirdSubmissionWithDesign] = deriveDecoder
}
