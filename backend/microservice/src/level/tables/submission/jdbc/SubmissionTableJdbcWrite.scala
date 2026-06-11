/** 投稿表的 JDBC 写操作（INSERT/UPDATE/DELETE）。
  *
  * 实现：PreparedStatement + Codec.bindRow；写成功后必要时 re-read 返回最新行。
  */
package microservice.level.tables.submission.jdbc

import microservice.level.tables.shared.SubmissionRow

import microservice.level.tables.submission._

import microservice.system.objects.SubmissionStatus
import java.sql.Connection

private[tables] object SubmissionTableJdbcWrite {
  def insert(connection: Connection, row: SubmissionRow): SubmissionRow = {
    val statement = connection.prepareStatement(
      """
        INSERT INTO submissions (
          id, level_id, submitter_id, status, reviewer_id, review_note, submitted_at, reviewed_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      """
    )
    try {
      statement.setString(1, row.id)
      statement.setString(2, row.levelId)
      statement.setString(3, row.submitterId)
      statement.setString(4, row.status.value)
      SubmissionTableCodec.setNullableString(statement, 5, row.reviewerId)
      SubmissionTableCodec.setNullableString(statement, 6, row.reviewNote)
      statement.setString(7, row.submittedAt)
      SubmissionTableCodec.setNullableString(statement, 8, row.reviewedAt)
      statement.executeUpdate()
      row
    } finally {
      statement.close()
    }
  }

  def updateReview(
    connection: Connection,
    submissionId: String,
    status: SubmissionStatus,
    reviewerId: String,
    reviewNote: Option[String],
    reviewedAt: String
  ): Option[SubmissionRow] = {
    val statement = connection.prepareStatement(
      """
        UPDATE submissions
        SET status = ?, reviewer_id = ?, review_note = ?, reviewed_at = ?
        WHERE id = ?
      """
    )
    try {
      statement.setString(1, status.value)
      statement.setString(2, reviewerId)
      SubmissionTableCodec.setNullableString(statement, 3, reviewNote)
      statement.setString(4, reviewedAt)
      statement.setString(5, submissionId)
      if (statement.executeUpdate() == 0) None else SubmissionTableJdbcRead.findById(connection, submissionId)
    } finally {
      statement.close()
    }
  }
}
