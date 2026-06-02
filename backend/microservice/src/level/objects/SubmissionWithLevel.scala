package microservice.level.objects

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import microservice.system.objects.SubmissionStatus

final case class SubmissionWithLevel(
  id: String,
  levelId: String,
  submitterId: String,
  status: SubmissionStatus,
  reviewerId: Option[String],
  reviewNote: Option[String],
  submittedAt: String,
  reviewedAt: Option[String],
  level: Level
)

object SubmissionWithLevel {
  def from(submission: Submission, level: Level): SubmissionWithLevel =
    SubmissionWithLevel(
      submission.id,
      submission.levelId,
      submission.submitterId,
      submission.status,
      submission.reviewerId,
      submission.reviewNote,
      submission.submittedAt,
      submission.reviewedAt,
      level
    )

  implicit val encoder: Encoder[SubmissionWithLevel] = deriveEncoder
  implicit val decoder: Decoder[SubmissionWithLevel] = deriveDecoder
}
