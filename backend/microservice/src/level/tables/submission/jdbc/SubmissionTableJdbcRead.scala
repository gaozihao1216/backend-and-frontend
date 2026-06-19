/** 投稿表的 JDBC 只读查询。
  *
  * 实现：PreparedStatement + Codec.rowFromResultSet；由 Table 门面在 connection != null 时委托。
  */
package microservice.level.tables.submission.jdbc

/** SubmissionTableJdbcRead 表访问门面。
  *
  * 表职责：封装 submissionjdbcread 数据的 CRUD。
  * Row↔Object 映射：通过 RowMapper/Codec 与领域对象互转。
  * inmemory/jdbc 双实现：connection == null 走 InMemoryStore，否则走 JDBC SQL。
  */
import microservice.level.tables.shared.SubmissionRow

import microservice.level.tables.submission._

import microservice.system.objects.SubmissionStatus
import java.sql.Connection

private[tables] object SubmissionTableJdbcRead {
  def listPending(connection: Connection): Vector[SubmissionRow] = {
    val statement = connection.prepareStatement(
      s"""
        ${SubmissionTableCodec.baseSelect}
        WHERE status = ?
        ORDER BY submitted_at ASC, id ASC
      """
    )
    try {
      statement.setString(1, SubmissionStatus.PendingReview.value)
      rows(statement.executeQuery())
    } finally {
      statement.close()
    }
  }

  def listApproved(connection: Connection): Vector[SubmissionRow] = {
    val statement = connection.prepareStatement(
      s"""
        ${SubmissionTableCodec.baseSelect}
        WHERE status = ?
        ORDER BY reviewed_at DESC, submitted_at DESC, id ASC
      """
    )
    try {
      statement.setString(1, SubmissionStatus.Approved.value)
      rows(statement.executeQuery())
    } finally {
      statement.close()
    }
  }

  def hasPendingForLevel(connection: Connection, levelId: String): Boolean = {
    val statement = connection.prepareStatement(
      """
        SELECT 1
        FROM submissions
        WHERE level_id = ? AND status = ?
        LIMIT 1
      """
    )
    try {
      statement.setString(1, levelId)
      statement.setString(2, SubmissionStatus.PendingReview.value)
      val resultSet = statement.executeQuery()
      try resultSet.next()
      finally resultSet.close()
    } finally {
      statement.close()
    }
  }

  def nextId(connection: Connection): String = {
    val statement = connection.prepareStatement("SELECT COUNT(*) AS submission_count FROM submissions")
    try {
      val resultSet = statement.executeQuery()
      try {
        if (resultSet.next()) s"submission-${resultSet.getInt("submission_count") + 1}" else "submission-1"
      } finally {
        resultSet.close()
      }
    } finally {
      statement.close()
    }
  }

  def findById(connection: Connection, submissionId: String): Option[SubmissionRow] = {
    val statement = connection.prepareStatement(s"${SubmissionTableCodec.baseSelect} WHERE id = ?")
    try {
      statement.setString(1, submissionId)
      val resultSet = statement.executeQuery()
      try {
        if (resultSet.next()) Some(SubmissionTableCodec.rowFromResultSet(resultSet)) else None
      } finally {
        resultSet.close()
      }
    } finally {
      statement.close()
    }
  }

  private def rows(resultSet: java.sql.ResultSet): Vector[SubmissionRow] =
    try {
      val builder = Vector.newBuilder[SubmissionRow]
      while (resultSet.next()) {
        builder += SubmissionTableCodec.rowFromResultSet(resultSet)
      }
      builder.result()
    } finally {
      resultSet.close()
    }
}
