package microservice.admin.objects

import microservice.level.objects.Submission
import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}

final case class ReviewedSubmission(
  id: String,
  levelId: String,
  submitterId: String,
  status: String,
  reviewerId: Option[String],
  reviewNote: Option[String],
  submittedAt: String,
  reviewedAt: Option[String]
)

object ReviewedSubmission {
  def fromSubmission(submission: Submission): ReviewedSubmission =
    ReviewedSubmission(
      submission.id,
      submission.levelId,
      submission.submitterId,
      submission.status.value,
      submission.reviewerId,
      submission.reviewNote,
      submission.submittedAt,
      submission.reviewedAt
    )

  implicit val encoder: Encoder[ReviewedSubmission] = deriveEncoder
  implicit val decoder: Decoder[ReviewedSubmission] = deriveDecoder
}
