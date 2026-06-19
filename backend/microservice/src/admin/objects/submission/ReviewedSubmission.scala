package microservice.admin.objects.submission

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import microservice.level.objects.Submission

/** 审核完成后的关卡投稿快照 DTO（status 为字符串便于 JSON 序列化）。
  *
  * 关联：ReviewSubmissionAPIMessage 成功响应；fromSubmission 从 level.objects.Submission 转换。
  */
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
