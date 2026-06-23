package microservice.admin.tables.jdbc

import java.sql.Connection
import microservice.admin.tables.{AdminAuditTableCodec, ReviewAuditRow}

private[tables] object AdminAuditTableJdbc {
def initialize(connection: Connection): Unit = {
    val statement = connection.createStatement()
    try {
      statement.executeUpdate(
        """
          CREATE TABLE IF NOT EXISTS review_audits (
            id TEXT PRIMARY KEY,
            target_type TEXT NOT NULL,
            submission_id TEXT NOT NULL,
            reviewer_id TEXT NOT NULL REFERENCES users(id),
            decision TEXT NOT NULL,
            review_note TEXT,
            reviewed_at TEXT NOT NULL
          )
        """
      )
      statement.executeUpdate(
        """
          CREATE INDEX IF NOT EXISTS review_audits_submission_id_idx
          ON review_audits (submission_id, reviewed_at DESC)
        """
      )
      statement.executeUpdate(
        """
          CREATE INDEX IF NOT EXISTS review_audits_reviewer_id_idx
          ON review_audits (reviewer_id, reviewed_at DESC)
        """
      )
    } finally {
      statement.close()
    }
  }

def listAll(connection: Connection): Vector[ReviewAuditRow] = {
    val statement = connection.prepareStatement(s"${AdminAuditTableCodec.baseSelect} ORDER BY reviewed_at DESC, id ASC")
    try {
      val resultSet = statement.executeQuery()
      try {
        val rows = Vector.newBuilder[ReviewAuditRow]
        while (resultSet.next()) {
          rows += AdminAuditTableCodec.rowFromResultSet(resultSet)
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
      s"${AdminAuditTableCodec.baseSelect} WHERE submission_id = ? ORDER BY reviewed_at DESC, id ASC"
    )
    try {
      statement.setString(1, submissionId)
      val resultSet = statement.executeQuery()
      try {
        val rows = Vector.newBuilder[ReviewAuditRow]
        while (resultSet.next()) {
          rows += AdminAuditTableCodec.rowFromResultSet(resultSet)
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
      s"${AdminAuditTableCodec.baseSelect} WHERE reviewer_id = ? ORDER BY reviewed_at DESC, id ASC"
    )
    try {
      statement.setString(1, reviewerId)
      val resultSet = statement.executeQuery()
      try {
        val rows = Vector.newBuilder[ReviewAuditRow]
        while (resultSet.next()) {
          rows += AdminAuditTableCodec.rowFromResultSet(resultSet)
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
      AdminAuditTableCodec.bindRow(statement, row)
      statement.executeUpdate()
      row
    } finally {
      statement.close()
    }
  }
}
