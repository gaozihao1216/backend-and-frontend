package microservice.bird.objects.submission

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import microservice.system.objects.enums.SubmissionStatus

/** 审核完成后的鸟类投稿快照 DTO，供 POST review 成功响应。
  *
  * 关联：ReviewBirdSubmissionAPIMessage；fromSubmission 从 BirdSubmission 转换。
  */
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

/** ReviewedBirdSubmission 伴生对象：审核结果转换与 Circe JSON 编解码。 */
private[bird] object ReviewedBirdSubmission {
  /** 从 BirdSubmission 领域对象转换为审核成功响应 DTO。 */
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
