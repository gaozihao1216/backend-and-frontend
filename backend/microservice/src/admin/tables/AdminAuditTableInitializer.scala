package microservice.admin.tables

import java.sql.Connection

object AdminAuditTableInitializer {
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
}
