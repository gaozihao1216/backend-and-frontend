package microservice.admin.objects.director.level_assignment

import io.circe.generic.semiauto._
import io.circe.{Decoder, Encoder}
import microservice.level.objects.inventory.{BirdPool}
import microservice.level.objects.submission.{SubmissionWithLevel}
import microservice.level.tables.shared.LevelSlotAssignmentRow

/** 关卡槽位分配记录 DTO。
  *
  * 领域含义：将 LevelSlotAssignmentRow 转为 API 响应；表示 level01–level10 某槽位绑定的 UGC 关卡。
  * 字段：levelSuffix 槽位；submissionId/sourceLevelId 绑定投稿与源关卡；birdPool 玩家备战鸟池。
  * 使用者：Director 关卡分配看板、Assign/Unassign/UpdateBirdPool 接口。
  */
final case class LevelSlotAssignment(
  id: String,
  levelSuffix: String,
  submissionId: String,
  sourceLevelId: String,
  assignedById: String,
  assignedAt: String,
  note: Option[String],
  birdPool: Option[BirdPool] = None
)

/** LevelSlotAssignment 的 Row 转换与 Circe 编解码 companion。 */
object LevelSlotAssignment {
  def from(row: LevelSlotAssignmentRow): LevelSlotAssignment =
    LevelSlotAssignment(
      id = row.id,
      levelSuffix = row.levelSuffix,
      submissionId = row.submissionId,
      sourceLevelId = row.sourceLevelId,
      assignedById = row.assignedById,
      assignedAt = row.assignedAt,
      note = row.note,
      birdPool = row.birdPool
    )

  implicit val encoder: Encoder[LevelSlotAssignment] = deriveEncoder
  implicit val decoder: Decoder[LevelSlotAssignment] = deriveDecoder
}

/** 槽位分配详情 DTO：assignment 元数据 + 关联投稿与关卡快照。 */
final case class LevelSlotAssignmentDetail(
  assignment: LevelSlotAssignment,
  submission: SubmissionWithLevel
)

/** LevelSlotAssignmentDetail 的 Circe 编解码 companion。 */
object LevelSlotAssignmentDetail {
  implicit val encoder: Encoder[LevelSlotAssignmentDetail] = deriveEncoder
  implicit val decoder: Decoder[LevelSlotAssignmentDetail] = deriveDecoder
}

/** 总监配置 bird pool 时的可选鸟条目 DTO（系统内置或设计师发布）。 */
final case class DirectorBirdPoolOption(
  birdType: String,
  name: String,
  source: String,
  authorId: Option[String] = None
)

/** DirectorBirdPoolOption 的 Circe 编解码 companion。 */
object DirectorBirdPoolOption {
  implicit val encoder: Encoder[DirectorBirdPoolOption] = deriveEncoder
  implicit val decoder: Decoder[DirectorBirdPoolOption] = deriveDecoder
}

/** 总监关卡分配看板 DTO：已占用槽位、待分配投稿、bird pool 下拉选项。 */
final case class DirectorLevelAssignmentBoard(
  assignments: List[LevelSlotAssignmentDetail],
  pendingApproved: List[SubmissionWithLevel],
  birdPoolOptions: List[DirectorBirdPoolOption] = Nil
)

/** DirectorLevelAssignmentBoard 的 Circe 编解码 companion。 */
object DirectorLevelAssignmentBoard {
  implicit val encoder: Encoder[DirectorLevelAssignmentBoard] = deriveEncoder
  implicit val decoder: Decoder[DirectorLevelAssignmentBoard] = deriveDecoder
}
