package microservice.bird.objects.submission

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import microservice.bird.objects.design.BirdDesign
import microservice.system.objects.SubmissionStatus

/** 待审核鸟类投稿的聚合视图：Submission 字段 + 嵌套完整 BirdDesign。
  *
  * 关联：GetPendingBirdSubmissionsAPIMessage 返回；from 工厂方法组装。
  */
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

/** BirdSubmissionWithDesign 伴生对象：鸟类投稿与设计聚合及 Circe JSON 编解码。 */
private[bird] object BirdSubmissionWithDesign {
  /** 将 BirdSubmission 与 BirdDesign 合并为待审列表用 DTO。 */
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
