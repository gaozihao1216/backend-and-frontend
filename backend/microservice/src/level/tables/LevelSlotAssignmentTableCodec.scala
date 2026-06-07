package microservice.level.tables

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
        note
      FROM level_slot_assignments
    """

  def rowFromResultSet(resultSet: java.sql.ResultSet): LevelSlotAssignmentRow =
    LevelSlotAssignmentRow(
      id = resultSet.getString("id"),
      levelSuffix = resultSet.getString("level_suffix"),
      submissionId = resultSet.getString("submission_id"),
      sourceLevelId = resultSet.getString("source_level_id"),
      assignedById = resultSet.getString("assigned_by_id"),
      assignedAt = resultSet.getString("assigned_at"),
      note = Option(resultSet.getString("note"))
    )
}
