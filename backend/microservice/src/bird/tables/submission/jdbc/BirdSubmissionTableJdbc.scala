package microservice.bird.tables.submission.jdbc

import java.sql.Connection
import microservice.bird.tables.shared.BirdSubmissionRow
import microservice.bird.tables.submission.BirdSubmissionTableCodec
import microservice.system.objects.SubmissionStatus

private[tables] object BirdSubmissionTableJdbc {
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

def nextId(connection: Connection): String = {
    val statement = connection.prepareStatement("SELECT COUNT(*) AS submission_count FROM bird_submissions")
    try {
      val resultSet = statement.executeQuery()
      try if (resultSet.next()) f"bird-submission-${resultSet.getInt("submission_count") + 1}%04d" else "bird-submission-0001"
      finally resultSet.close()
    } finally {
      statement.close()
    }
  }

  def findById(connection: Connection, submissionId: String): Option[BirdSubmissionRow] = {
    val statement = connection.prepareStatement(s"${BirdSubmissionTableCodec.baseSelect} WHERE id = ?")
    try {
      statement.setString(1, submissionId)
      val resultSet = statement.executeQuery()
      try if (resultSet.next()) Some(BirdSubmissionTableCodec.rowFromResultSet(resultSet)) else None
      finally resultSet.close()
    } finally {
      statement.close()
    }
  }

  def listPending(connection: Connection): Vector[BirdSubmissionRow] = {
    val statement = connection.prepareStatement(
      s"""
        ${BirdSubmissionTableCodec.baseSelect}
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

  def hasPendingForDesign(connection: Connection, designId: String): Boolean = {
    val statement = connection.prepareStatement(
      "SELECT 1 FROM bird_submissions WHERE bird_design_id = ? AND status = ?"
    )
    try {
      statement.setString(1, designId)
      statement.setString(2, SubmissionStatus.PendingReview.value)
      val resultSet = statement.executeQuery()
      try resultSet.next() finally resultSet.close()
    } finally {
      statement.close()
    }
  }

  private def rows(resultSet: java.sql.ResultSet): Vector[BirdSubmissionRow] =
    try {
      val builder = Vector.newBuilder[BirdSubmissionRow]
      while (resultSet.next()) builder += BirdSubmissionTableCodec.rowFromResultSet(resultSet)
      builder.result()
    } finally {
      resultSet.close()
    }

def insert(connection: Connection, row: BirdSubmissionRow): BirdSubmissionRow = {
    val statement = connection.prepareStatement(
      """
        INSERT INTO bird_submissions (
          id, bird_design_id, submitter_id, status, reviewer_id, review_note, submitted_at, reviewed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      """
    )
    try {
      BirdSubmissionTableCodec.bindRow(statement, row)
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
  ): Boolean = {
    val statement = connection.prepareStatement(
      """
        UPDATE bird_submissions
        SET status = ?, reviewer_id = ?, review_note = ?, reviewed_at = ?
        WHERE id = ?
      """
    )
    try {
      statement.setString(1, status.value)
      statement.setString(2, reviewerId)
      reviewNote match {
        case Some(value) => statement.setString(3, value)
        case None => statement.setNull(3, java.sql.Types.VARCHAR)
      }
      statement.setString(4, reviewedAt)
      statement.setString(5, submissionId)
      statement.executeUpdate() > 0
    } finally {
      statement.close()
    }
  }
}
