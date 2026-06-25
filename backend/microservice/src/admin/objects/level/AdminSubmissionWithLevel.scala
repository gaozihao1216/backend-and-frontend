package microservice.admin.objects.level

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import microservice.system.objects.enums.SubmissionStatus

/** 投稿与关卡快照（admin 模块自有 DTO，JSON 与 level.SubmissionWithLevel 对齐）。 */
final case class AdminSubmissionWithLevel(
  id: String,
  levelId: String,
  submitterId: String,
  status: SubmissionStatus,
  reviewerId: Option[String],
  reviewNote: Option[String],
  submittedAt: String,
  reviewedAt: Option[String],
  level: AdminLevelSnapshot
)

private[admin] object AdminSubmissionWithLevel {
  implicit val encoder: Encoder[AdminSubmissionWithLevel] = deriveEncoder
  implicit val decoder: Decoder[AdminSubmissionWithLevel] = deriveDecoder
}
