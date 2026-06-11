/** JDBC 读路径专用：SQL 列名 ↔ 投稿 Row 的编解码。
  *
  * 实现：baseSelect 复用 SELECT 片段；rowFromResultSet / bindRow 与 PostgreSQL snake_case 列对齐。
  */
package microservice.level.tables.submission

import microservice.level.tables.shared.SubmissionRow

import microservice.system.objects.SubmissionStatus
import java.sql.{PreparedStatement, ResultSet, SQLException, Types}

private[tables] object SubmissionTableCodec {
  val baseSelect: String =
    """
      SELECT id, level_id, submitter_id, status, reviewer_id, review_note, submitted_at, reviewed_at
      FROM submissions
    """

  def rowFromResultSet(resultSet: ResultSet): SubmissionRow =
    SubmissionRow(
      id = resultSet.getString("id"),
      levelId = resultSet.getString("level_id"),
      submitterId = resultSet.getString("submitter_id"),
      status = SubmissionStatus.fromString(resultSet.getString("status")).getOrElse(
        throw new SQLException(s"Unknown submission status: ${resultSet.getString("status")}")
      ),
      reviewerId = nullableString(resultSet, "reviewer_id"),
      reviewNote = nullableString(resultSet, "review_note"),
      submittedAt = resultSet.getString("submitted_at"),
      reviewedAt = nullableString(resultSet, "reviewed_at")
    )

  def setNullableString(statement: PreparedStatement, index: Int, value: Option[String]): Unit =
    value match {
      case Some(text) => statement.setString(index, text)
      case None => statement.setNull(index, Types.VARCHAR)
    }

  private def nullableString(resultSet: ResultSet, column: String): Option[String] =
    Option(resultSet.getString(column))
}
