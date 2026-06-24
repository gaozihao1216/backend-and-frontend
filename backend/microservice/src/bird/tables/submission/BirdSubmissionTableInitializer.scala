package microservice.bird.tables.submission

import java.sql.Connection

object BirdSubmissionTableInitializer {
  def initialize(connection: Connection): Unit = {
      val statement = connection.createStatement()
      try {
        statement.executeUpdate(
          """
            CREATE TABLE IF NOT EXISTS bird_submissions (
              id TEXT PRIMARY KEY,
              bird_design_id TEXT NOT NULL REFERENCES bird_designs(id),
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
