package microservice.admin.tables

import java.sql.{Connection, PreparedStatement, ResultSet}

/** 管理员审核审计行：append-only 记录每次投稿审核或总监废止决策。
  *
  * 字段：targetType 区分关卡/鸟类投稿或总监废止；decision 为 SubmissionStatus.value 字符串。
  * 关联：[[AdminAuditTable]]；映射为 [[microservice.admin.objects.submission.ReviewAudit]]。
  */
final case class ReviewAuditRow(
  id: String,
  targetType: String,
  submissionId: String,
  reviewerId: String,
  decision: String,
  reviewNote: Option[String],
  reviewedAt: String
)

/** 审核日志表访问入口：只使用 JDBC 连接，事务由 APIMessage/DatabaseSession 统一管理。 */
object AdminAuditTable {

  def listAll(connection: Connection): Vector[ReviewAuditRow] =
    AdminAuditTableSql.listAll(connection)

  def listBySubmissionId(connection: Connection, submissionId: String): Vector[ReviewAuditRow] =
    AdminAuditTableSql.listBySubmissionId(connection, submissionId)

  def listByReviewerId(connection: Connection, reviewerId: String): Vector[ReviewAuditRow] =
    AdminAuditTableSql.listByReviewerId(connection, reviewerId)

  def nextId(connection: Connection): String =
    AdminAuditTableSql.nextId(connection)

  def insert(connection: Connection, row: ReviewAuditRow): ReviewAuditRow =
    AdminAuditTableSql.insert(connection, row)

  def recordReview(
    connection: Connection,
    submissionId: String,
    reviewerId: String,
    targetType: String,
    decision: String,
    reviewNote: Option[String],
    reviewedAt: String
  ): ReviewAuditRow = {
    val row = ReviewAuditRow(
      id = nextId(connection),
      submissionId = submissionId,
      reviewerId = reviewerId,
      targetType = targetType,
      decision = decision,
      reviewNote = reviewNote,
      reviewedAt = reviewedAt
    )
    insert(connection, row)
  }
}

private[tables] object AdminAuditTableSql {
  private val baseSelect: String =
    """
      SELECT id, target_type, submission_id, reviewer_id, decision, review_note, reviewed_at
      FROM review_audits
    """

def listAll(connection: Connection): Vector[ReviewAuditRow] = {
    val statement = connection.prepareStatement(s"$baseSelect ORDER BY reviewed_at DESC, id ASC")
    try {
      val resultSet = statement.executeQuery()
      try {
        val rows = Vector.newBuilder[ReviewAuditRow]
        while (resultSet.next()) {
          rows += rowFromResultSet(resultSet)
        }
        rows.result()
      } finally {
        resultSet.close()
      }
    } finally {
      statement.close()
    }
  }

  def listBySubmissionId(connection: Connection, submissionId: String): Vector[ReviewAuditRow] = {
    val statement = connection.prepareStatement(
      s"$baseSelect WHERE submission_id = ? ORDER BY reviewed_at DESC, id ASC"
    )
    try {
      statement.setString(1, submissionId)
      val resultSet = statement.executeQuery()
      try {
        val rows = Vector.newBuilder[ReviewAuditRow]
        while (resultSet.next()) {
          rows += rowFromResultSet(resultSet)
        }
        rows.result()
      } finally {
        resultSet.close()
      }
    } finally {
      statement.close()
    }
  }

  def listByReviewerId(connection: Connection, reviewerId: String): Vector[ReviewAuditRow] = {
    val statement = connection.prepareStatement(
      s"$baseSelect WHERE reviewer_id = ? ORDER BY reviewed_at DESC, id ASC"
    )
    try {
      statement.setString(1, reviewerId)
      val resultSet = statement.executeQuery()
      try {
        val rows = Vector.newBuilder[ReviewAuditRow]
        while (resultSet.next()) {
          rows += rowFromResultSet(resultSet)
        }
        rows.result()
      } finally {
        resultSet.close()
      }
    } finally {
      statement.close()
    }
  }

  def nextId(connection: Connection): String = {
    val statement = connection.prepareStatement("SELECT COUNT(*) AS audit_count FROM review_audits")
    try {
      val resultSet = statement.executeQuery()
      try {
        if (resultSet.next()) s"review-audit-${resultSet.getInt("audit_count") + 1}" else "review-audit-1"
      } finally {
        resultSet.close()
      }
    } finally {
      statement.close()
    }
  }

def insert(connection: Connection, row: ReviewAuditRow): ReviewAuditRow = {
    val statement = connection.prepareStatement(
      """
        INSERT INTO review_audits (
          id, target_type, submission_id, reviewer_id, decision, review_note, reviewed_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      """
    )
    try {
      bindRow(statement, row)
      statement.executeUpdate()
      row
    } finally {
      statement.close()
    }
  }

  private def rowFromResultSet(resultSet: ResultSet): ReviewAuditRow =
    ReviewAuditRow(
      id = resultSet.getString("id"),
      targetType = resultSet.getString("target_type"),
      submissionId = resultSet.getString("submission_id"),
      reviewerId = resultSet.getString("reviewer_id"),
      decision = resultSet.getString("decision"),
      reviewNote = Option(resultSet.getString("review_note")),
      reviewedAt = resultSet.getString("reviewed_at")
    )

  private def bindRow(statement: PreparedStatement, row: ReviewAuditRow): Unit = {
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
