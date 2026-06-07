package microservice.level.tables

import java.sql.Connection

private[tables] object LevelSlotAssignmentTableJdbcRead {
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
}
