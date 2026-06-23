package microservice.admin.objects.director.level_assignment.assignment

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import microservice.admin.objects.level.AdminSubmissionWithLevel

/** 槽位分配详情 DTO：assignment 元数据 + 关联投稿与关卡快照。 */
final case class LevelSlotAssignmentDetail(
  assignment: LevelSlotAssignment,
  submission: AdminSubmissionWithLevel
)

private[admin] object LevelSlotAssignmentDetail {
  implicit val encoder: Encoder[LevelSlotAssignmentDetail] = deriveEncoder
  implicit val decoder: Decoder[LevelSlotAssignmentDetail] = deriveDecoder
}
