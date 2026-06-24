package microservice.level.tables.submission

import java.sql.Connection
import microservice.level.tables.shared.SubmissionRow
import microservice.level.tables.submission._
import microservice.system.objects.SubmissionStatus

object SubmissionTable {

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
      if (statement.executeUpdate() == 0) None else SubmissionTable.findById(connection, submissionId)
    } finally {
      statement.close()
    }
  }
}
