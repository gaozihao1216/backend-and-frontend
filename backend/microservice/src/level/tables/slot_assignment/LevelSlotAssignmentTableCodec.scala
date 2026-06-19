/** JDBC 读路径专用：SQL 列名 ↔ 关卡槽位 Row 的编解码。
  *
  * 实现：baseSelect 复用 SELECT 片段；rowFromResultSet / bindRow 与 PostgreSQL snake_case 列对齐。
  */
package microservice.level.tables.slot_assignment

import microservice.level.tables.shared.LevelSlotAssignmentRow

import io.circe.parser.decode
import io.circe.syntax._
import microservice.level.objects.inventory.BirdPool

private[tables] object LevelSlotAssignmentTableCodec {
  val baseSelect: String =
    """
      SELECT
        id,
        level_suffix,
        submission_id,
        source_level_id,
        assigned_by_id,
        assigned_at,
        note,
        bird_pool_json
      FROM level_slot_assignments
    """

  def encodeBirdPool(pool: Option[BirdPool]): String =
    pool.asJson.noSpaces

  def decodeBirdPool(raw: String): Option[BirdPool] =
    if (raw == null || raw.trim.isEmpty) None
    else decode[BirdPool](raw).toOption

  def rowFromResultSet(resultSet: java.sql.ResultSet): LevelSlotAssignmentRow =
    LevelSlotAssignmentRow(
      id = resultSet.getString("id"),
      levelSuffix = resultSet.getString("level_suffix"),
      submissionId = resultSet.getString("submission_id"),
      sourceLevelId = resultSet.getString("source_level_id"),
      assignedById = resultSet.getString("assigned_by_id"),
      assignedAt = resultSet.getString("assigned_at"),
      note = Option(resultSet.getString("note")),
      birdPool = decodeBirdPool(resultSet.getString("bird_pool_json"))
    )
}
