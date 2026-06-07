package microservice.level.tables

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
