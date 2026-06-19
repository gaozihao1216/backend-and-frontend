package microservice.admin.objects.submission

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import microservice.level.objects.submission.Submission

/** 审核完成后的关卡投稿快照 DTO。
  *
  * 领域含义：管理员审核接口的成功响应体，status 为字符串便于 JSON 序列化。
  * 字段：id/levelId/submitterId 标识投稿；status 审核结果；reviewerId/reviewNote/reviewedAt 审核元数据。
  * 使用者：ReviewSubmissionAPIMessage；前端 admin 审核页展示审核结果。
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

/** ReviewedSubmission 的转换与 Circe 编解码 companion。 */
object ReviewedSubmission {
  /** 从 level 模块 Submission 领域对象转换为 API DTO。 */
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
