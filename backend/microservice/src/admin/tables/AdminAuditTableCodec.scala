package microservice.admin.tables

import java.sql.{PreparedStatement, ResultSet}

/** JDBC 读路径：review_audits 列名 ↔ [[ReviewAuditRow]]。 */
private[tables] object AdminAuditTableCodec {
  val baseSelect: String =
    """
      SELECT id, target_type, submission_id, reviewer_id, decision, review_note, reviewed_at
      FROM review_audits
    """

  def rowFromResultSet(resultSet: ResultSet): ReviewAuditRow =
    ReviewAuditRow(
      id = resultSet.getString("id"),
      targetType = resultSet.getString("target_type"),
      submissionId = resultSet.getString("submission_id"),
      reviewerId = resultSet.getString("reviewer_id"),
      decision = resultSet.getString("decision"),
      reviewNote = Option(resultSet.getString("review_note")),
      reviewedAt = resultSet.getString("reviewed_at")
    )

  def bindRow(statement: PreparedStatement, row: ReviewAuditRow): Unit = {
    statement.setString(1, row.id)
    statement.setString(2, row.targetType)
    statement.setString(3, row.submissionId)
    statement.setString(4, row.reviewerId)
    statement.setString(5, row.decision)
    row.reviewNote match {
      case Some(note) => statement.setString(6, note)
      case None       => statement.setNull(6, java.sql.Types.VARCHAR)
    }
    statement.setString(7, row.reviewedAt)
  }
}
