package microservice.level.tables.slot_assignment

import java.sql.Connection
import microservice.level.tables.shared.LevelSlotAssignmentRow
import microservice.level.tables.slot_assignment._

object LevelSlotAssignmentTable {

def listAll(connection: Connection): Vector[LevelSlotAssignmentRow] = {
    val statement = connection.prepareStatement(
      s"""
        ${LevelSlotAssignmentTableCodec.baseSelect}
        ORDER BY level_suffix ASC, assigned_at ASC
      """
    )
    try rows(statement.executeQuery())
    finally statement.close()
  }

  def findBySuffix(connection: Connection, levelSuffix: String): Option[LevelSlotAssignmentRow] = {
    val statement = connection.prepareStatement(s"${LevelSlotAssignmentTableCodec.baseSelect} WHERE level_suffix = ?")
    try {
      statement.setString(1, levelSuffix)
      val resultSet = statement.executeQuery()
      try {
        if (resultSet.next()) Some(LevelSlotAssignmentTableCodec.rowFromResultSet(resultSet)) else None
      } finally {
        resultSet.close()
      }
    } finally {
      statement.close()
    }
  }

  def nextId(connection: Connection): String = {
    val statement = connection.prepareStatement("SELECT COUNT(*) AS assignment_count FROM level_slot_assignments")
    try {
      val resultSet = statement.executeQuery()
      try {
        if (resultSet.next()) s"level-slot-assignment-${resultSet.getInt("assignment_count") + 1}" else "level-slot-assignment-1"
      } finally {
        resultSet.close()
      }
    } finally {
      statement.close()
    }
  }

  private def rows(resultSet: java.sql.ResultSet): Vector[LevelSlotAssignmentRow] =
    try {
      val builder = Vector.newBuilder[LevelSlotAssignmentRow]
      while (resultSet.next()) {
        builder += LevelSlotAssignmentTableCodec.rowFromResultSet(resultSet)
      }
      builder.result()
    } finally {
      resultSet.close()
    }

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
