package microservice.admin.objects.director.level_assignment.board

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import microservice.admin.objects.director.level_assignment.assignment.LevelSlotAssignmentDetail
import microservice.admin.objects.level.AdminSubmissionWithLevel

/** 总监关卡分配看板 DTO：已占用槽位、待分配投稿、bird pool 下拉选项。 */
final case class DirectorLevelAssignmentBoard(
  assignments: List[LevelSlotAssignmentDetail],
  pendingApproved: List[AdminSubmissionWithLevel],
  birdPoolOptions: List[DirectorBirdPoolOption] = Nil
)

private[admin] object DirectorLevelAssignmentBoard {
  implicit val encoder: Encoder[DirectorLevelAssignmentBoard] = deriveEncoder
  implicit val decoder: Decoder[DirectorLevelAssignmentBoard] = deriveDecoder
}
