package microservice.level.objects.slot

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import microservice.level.objects.inventory.BirdPool
import microservice.level.tables.shared.LevelSlotAssignmentRow

/** 关卡槽位分配（level 模块领域对象）；供 internal API 返回，admin 再映射为 LevelSlotAssignment。 */
final case class SlotAssignment(
  id: String,
  levelSuffix: String,
  submissionId: String,
  sourceLevelId: String,
  assignedById: String,
  assignedAt: String,
  note: Option[String],
  birdPool: Option[BirdPool] = None
)

private[level] object SlotAssignment {
  import microservice.level.objects.codec.LevelCrossModuleCodecs._
  def from(row: LevelSlotAssignmentRow): SlotAssignment =
    SlotAssignment(
      id = row.id,
      levelSuffix = row.levelSuffix,
      submissionId = row.submissionId,
      sourceLevelId = row.sourceLevelId,
      assignedById = row.assignedById,
      assignedAt = row.assignedAt,
      note = row.note,
      birdPool = row.birdPool
    )

  implicit val encoder: Encoder[SlotAssignment] = deriveEncoder
  implicit val decoder: Decoder[SlotAssignment] = deriveDecoder
}
