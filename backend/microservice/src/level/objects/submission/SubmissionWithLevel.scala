package microservice.level.objects.submission

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import microservice.level.objects.level.Level
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
