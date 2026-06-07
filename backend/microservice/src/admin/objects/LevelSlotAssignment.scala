package microservice.admin.objects

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import microservice.level.objects.SubmissionWithLevel
import microservice.level.tables.LevelSlotAssignmentRow

final case class LevelSlotAssignment(
  id: String,
  levelSuffix: String,
  submissionId: String,
  sourceLevelId: String,
  assignedById: String,
  assignedAt: String,
  note: Option[String]
)

object LevelSlotAssignment {
  def from(row: LevelSlotAssignmentRow): LevelSlotAssignment =
    LevelSlotAssignment(
      id = row.id,
      levelSuffix = row.levelSuffix,
      submissionId = row.submissionId,
      sourceLevelId = row.sourceLevelId,
      assignedById = row.assignedById,
      assignedAt = row.assignedAt,
      note = row.note
    )

  implicit val encoder: Encoder[LevelSlotAssignment] = deriveEncoder
  implicit val decoder: Decoder[LevelSlotAssignment] = deriveDecoder
}

final case class LevelSlotAssignmentDetail(
  assignment: LevelSlotAssignment,
  submission: SubmissionWithLevel
)

object LevelSlotAssignmentDetail {
  implicit val encoder: Encoder[LevelSlotAssignmentDetail] = deriveEncoder
  implicit val decoder: Decoder[LevelSlotAssignmentDetail] = deriveDecoder
}

final case class DirectorLevelAssignmentBoard(
  assignments: List[LevelSlotAssignmentDetail],
  pendingApproved: List[SubmissionWithLevel]
)

object DirectorLevelAssignmentBoard {
  implicit val encoder: Encoder[DirectorLevelAssignmentBoard] = deriveEncoder
  implicit val decoder: Decoder[DirectorLevelAssignmentBoard] = deriveDecoder
}
