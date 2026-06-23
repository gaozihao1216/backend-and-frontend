/** JDBC 读路径专用：SQL 列名 ↔ 鸟类投稿 Row 的编解码。
  *
  * 实现：baseSelect 复用 SELECT 片段；rowFromResultSet 与 PostgreSQL snake_case 列对齐。
  */
package microservice.bird.tables.submission

import microservice.bird.tables.shared.BirdSubmissionRow

import microservice.system.objects.SubmissionStatus

private[tables] object BirdSubmissionTableCodec {
  val baseSelect: String =
    """
      SELECT id, bird_design_id, submitter_id, status, reviewer_id, review_note, submitted_at, reviewed_at
      FROM bird_submissions
    """

  def rowFromResultSet(resultSet: java.sql.ResultSet): BirdSubmissionRow =
    BirdSubmissionRow(
      id = resultSet.getString("id"),
      birdDesignId = resultSet.getString("bird_design_id"),
      submitterId = resultSet.getString("submitter_id"),
      status = SubmissionStatus.fromString(resultSet.getString("status")).getOrElse(SubmissionStatus.PendingReview),
      reviewerId = Option(resultSet.getString("reviewer_id")),
      reviewNote = Option(resultSet.getString("review_note")),
      submittedAt = resultSet.getString("submitted_at"),
      reviewedAt = Option(resultSet.getString("reviewed_at"))
    )

  def bindRow(statement: java.sql.PreparedStatement, row: BirdSubmissionRow): Unit = {
    statement.setString(1, row.id)
    statement.setString(2, row.birdDesignId)
    statement.setString(3, row.submitterId)
    statement.setString(4, row.status.value)
    row.reviewerId match {
      case Some(value) => statement.setString(5, value)
      case None => statement.setNull(5, java.sql.Types.VARCHAR)
    }
    row.reviewNote match {
      case Some(value) => statement.setString(6, value)
      case None => statement.setNull(6, java.sql.Types.VARCHAR)
    }
    statement.setString(7, row.submittedAt)
    row.reviewedAt match {
      case Some(value) => statement.setString(8, value)
      case None => statement.setNull(8, java.sql.Types.VARCHAR)
    }
  }
}
