/** 关卡槽位表的 JDBC 写操作（INSERT/UPDATE/DELETE）。
  *
  * 实现：PreparedStatement + Codec.bindRow；写成功后必要时 re-read 返回最新行。
  */
package microservice.level.tables.slot_assignment.jdbc

/** LevelSlotAssignmentTableJdbcWrite 表访问门面。
  *
  * 表职责：封装 levelslotassignmentjdbcwrite 数据的 CRUD。
  * Row↔Object 映射：通过 RowMapper/Codec 与领域对象互转。
  * inmemory/jdbc 双实现：connection == null 走 InMemoryStore，否则走 JDBC SQL。
  */
import microservice.level.tables.shared.LevelSlotAssignmentRow

import microservice.level.tables.slot_assignment._

import java.sql.Connection

private[tables] object LevelSlotAssignmentTableJdbcWrite {
  def upsert(connection: Connection, row: LevelSlotAssignmentRow): LevelSlotAssignmentRow = {
    deleteBySubmissionId(connection, row.submissionId)
    deleteBySuffix(connection, row.levelSuffix)

    val statement = connection.prepareStatement(
      """
        INSERT INTO level_slot_assignments (
          id,
          level_suffix,
          submission_id,
          source_level_id,
          assigned_by_id,
          assigned_at,
          note,
          bird_pool_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      """
    )
    try {
      statement.setString(1, row.id)
      statement.setString(2, row.levelSuffix)
      statement.setString(3, row.submissionId)
      statement.setString(4, row.sourceLevelId)
      statement.setString(5, row.assignedById)
      statement.setString(6, row.assignedAt)
      statement.setString(7, row.note.orNull)
      statement.setString(8, LevelSlotAssignmentTableCodec.encodeBirdPool(row.birdPool))
      statement.executeUpdate()
      row
    } finally {
      statement.close()
    }
  }

  def deleteBySuffix(connection: Connection, levelSuffix: String): Boolean = {
    val statement = connection.prepareStatement("DELETE FROM level_slot_assignments WHERE level_suffix = ?")
    try {
      statement.setString(1, levelSuffix)
      statement.executeUpdate() > 0
    } finally {
      statement.close()
    }
  }

  def deleteBySubmissionId(connection: Connection, submissionId: String): Boolean = {
    val statement = connection.prepareStatement("DELETE FROM level_slot_assignments WHERE submission_id = ?")
    try {
      statement.setString(1, submissionId)
      statement.executeUpdate() > 0
    } finally {
      statement.close()
    }
  }
}
