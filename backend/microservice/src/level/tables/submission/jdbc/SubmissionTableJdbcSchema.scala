package microservice.level.tables.submission.jdbc

import microservice.level.tables.shared.SubmissionRow

import microservice.level.tables.submission._

import java.sql.Connection

private[tables] object SubmissionTableJdbcSchema {
  def initialize(connection: Connection): Unit = {
    val statement = connection.createStatement()
    try {
      statement.executeUpdate(
        """
          CREATE TABLE IF NOT EXISTS submissions (
            id TEXT PRIMARY KEY,
            level_id TEXT NOT NULL REFERENCES levels(id),
            submitter_id TEXT NOT NULL REFERENCES users(id),
            status TEXT NOT NULL,
            reviewer_id TEXT REFERENCES users(id),
            review_note TEXT,
            submitted_at TEXT NOT NULL,
            reviewed_at TEXT
          )
        """
      )
    } finally {
      statement.close()
    }
  }
}
