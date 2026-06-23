package microservice.admin.objects.director.level_assignment.assignment

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import microservice.level.objects.submission.SubmissionWithLevel

/** 槽位分配详情 DTO：assignment 元数据 + 关联投稿与关卡快照。 */
final case class LevelSlotAssignmentDetail(
  assignment: LevelSlotAssignment,
  submission: SubmissionWithLevel
)

object LevelSlotAssignmentDetail {
  implicit val encoder: Encoder[LevelSlotAssignmentDetail] = deriveEncoder
  implicit val decoder: Decoder[LevelSlotAssignmentDetail] = deriveDecoder
}
