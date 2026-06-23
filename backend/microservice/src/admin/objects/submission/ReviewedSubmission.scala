package microservice.admin.objects.submission

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}

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

private[admin] object ReviewedSubmission {
  implicit val encoder: Encoder[ReviewedSubmission] = deriveEncoder
  implicit val decoder: Decoder[ReviewedSubmission] = deriveDecoder
}
