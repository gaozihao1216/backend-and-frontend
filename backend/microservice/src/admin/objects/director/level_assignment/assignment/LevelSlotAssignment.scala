package microservice.admin.objects.director.level_assignment.assignment

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import microservice.admin.objects.level.AdminBirdPool

/** 关卡槽位分配记录 DTO。
  *
  * 领域含义：表示 level01–level10 某槽位绑定的 UGC 关卡。
  * 字段：levelSuffix 槽位；submissionId/sourceLevelId 绑定投稿与源关卡；note 分配备注；birdPool 玩家备战鸟池（缺省 AdminBirdPool.default）。
  *
  * 写入语义（AssignLevelSlotRequest）：
  *   - submissionId 须为 Approved 投稿
  *   - note 可选，持久化到 note 字段
  *   - birdPool 可选，缺省 AdminBirdPool.default
  *
  * 关联：AssignLevelSlot / UnassignLevelSlot / UpdateLevelSlotBirdPool APIMessage。
  */
final case class LevelSlotAssignment(
  id: String,
  levelSuffix: String,
  submissionId: String,
  sourceLevelId: String,
  assignedById: String,
  assignedAt: String,
  note: Option[String],
  birdPool: Option[AdminBirdPool] = None
)

private[admin] object LevelSlotAssignment {
  implicit val encoder: Encoder[LevelSlotAssignment] = deriveEncoder
  implicit val decoder: Decoder[LevelSlotAssignment] = deriveDecoder
}
