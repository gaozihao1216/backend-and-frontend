/** JDBC 读路径专用：SQL 列名 ↔ 投稿 Row 的编解码。
  *
  * 实现：baseSelect 复用 SELECT 片段；rowFromResultSet / bindRow 与 PostgreSQL snake_case 列对齐。
  */
package microservice.level.tables.submission

/** SubmissionTableCodec 表访问门面。
  *
  * 表职责：封装 submissioncodec 数据的 CRUD。
  * Row↔Object 映射：通过 RowMapper/Codec 与领域对象互转。
  * JDBC 表字段编解码：负责 ResultSet 映射与 SQL 参数绑定。
  */
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
