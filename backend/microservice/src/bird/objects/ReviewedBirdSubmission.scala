package microservice.bird.objects

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import microservice.system.objects.SubmissionStatus

final case class ReviewedBirdSubmission(
  id: String,
  birdDesignId: String,
  submitterId: String,
  status: SubmissionStatus,
  reviewerId: Option[String],
  reviewNote: Option[String],
  submittedAt: String,
  reviewedAt: Option[String]
)

object ReviewedBirdSubmission {
  def fromSubmission(submission: BirdSubmission): ReviewedBirdSubmission =
    ReviewedBirdSubmission(
      submission.id,
      submission.birdDesignId,
      submission.submitterId,
      submission.status,
      submission.reviewerId,
      submission.reviewNote,
      submission.submittedAt,
      submission.reviewedAt
    )

  implicit val encoder: Encoder[ReviewedBirdSubmission] = deriveEncoder
  implicit val decoder: Decoder[ReviewedBirdSubmission] = deriveDecoder
}
