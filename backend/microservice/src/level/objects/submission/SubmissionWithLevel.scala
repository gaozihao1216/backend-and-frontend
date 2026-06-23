package microservice.level.objects.submission

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import microservice.level.objects.core.Level
import microservice.system.objects.SubmissionStatus

/** 投稿记录与关卡详情的组合 DTO，供管理员审核看板使用。
  *
  * 字段说明：
  *   - id / levelId / submitterId / status / reviewerId / reviewNote / submittedAt / reviewedAt：Submission 字段
  *   - level：嵌套的完整 Level 对象
  */
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

/** SubmissionWithLevel 伴生对象：投稿与关卡聚合及 Circe JSON 编解码。 */
private[level] object SubmissionWithLevel {
  /** 将 Submission 与 Level 合并为管理员看板用 DTO。 */
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
