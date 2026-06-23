package microservice.level.objects.submission

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import microservice.system.objects.SubmissionStatus

/** 关卡投稿记录，设计师提交审核后生成。
  *
  * 字段说明：
  *   - id / levelId / submitterId：投稿标识与关联
  *   - status：投稿审核状态（PendingReview / Approved / Rejected 等）
  *   - reviewerId / reviewNote / reviewedAt：审核人、备注与时间
  *   - submittedAt：提交时间
  */
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

/** Submission 伴生对象：Circe JSON 编解码，供关卡投稿 API 响应。 */
private[level] object Submission {
  implicit val encoder: Encoder[Submission] = deriveEncoder
  implicit val decoder: Decoder[Submission] = deriveDecoder
}
