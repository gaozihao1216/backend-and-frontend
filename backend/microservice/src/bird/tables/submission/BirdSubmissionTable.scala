package microservice.bird.tables.submission

import java.sql.Connection
import microservice.bird.objects.submission.BirdSubmission
import microservice.system.objects.enums.SubmissionStatus

final case class BirdSubmissionRow(
  id: String,
  birdDesignId: String,
  submitterId: String,
  status: SubmissionStatus,
  reviewerId: Option[String],
  reviewNote: Option[String],
  submittedAt: String,
  reviewedAt: Option[String]
)

/** 鸟类设计投稿表访问入口：只使用 JDBC 连接，事务由 APIMessage/DatabaseSession 统一管理。 */
object BirdSubmissionTable {

  def nextId(connection: Connection): String =
    BirdSubmissionTableSql.nextId(connection)

  def insert(connection: Connection, row: BirdSubmissionRow): BirdSubmissionRow =
    BirdSubmissionTableSql.insert(connection, row)

  def findById(connection: Connection, submissionId: String): Option[BirdSubmissionRow] =
    BirdSubmissionTableSql.findById(connection, submissionId)

  def listPending(connection: Connection): Vector[BirdSubmissionRow] =
    BirdSubmissionTableSql.listPending(connection)

  def hasPendingForDesign(connection: Connection, designId: String): Boolean =
    BirdSubmissionTableSql.hasPendingForDesign(connection, designId)

  def updateReview(
    connection: Connection,
    submissionId: String,
    status: SubmissionStatus,
    reviewerId: String,
    reviewNote: Option[String],
    reviewedAt: String
  ): Option[BirdSubmissionRow] =
    findById(connection, submissionId).flatMap { existing =>
      val updated = existing.copy(
        status = status,
        reviewerId = Some(reviewerId),
        reviewNote = reviewNote,
        reviewedAt = Some(reviewedAt)
      )
      if (BirdSubmissionTableSql.updateReview(connection, submissionId, status, reviewerId, reviewNote, reviewedAt)) {
        Some(updated)
      } else None
    }

  def toBirdSubmission(row: BirdSubmissionRow): BirdSubmission =
    BirdSubmission(
      id = row.id,
      birdDesignId = row.birdDesignId,
      submitterId = row.submitterId,
      status = row.status,
      reviewerId = row.reviewerId,
      reviewNote = row.reviewNote,
      submittedAt = row.submittedAt,
      reviewedAt = row.reviewedAt
    )
}

import java.sql.Connection
import microservice.system.objects.enums.SubmissionStatus

private[tables] object BirdSubmissionTableSql {
  private val baseSelect: String =
    """
      SELECT id, bird_design_id, submitter_id, status, reviewer_id, review_note, submitted_at, reviewed_at
      FROM bird_submissions
    """

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
    val statement = connection.prepareStatement(s"$baseSelect WHERE id = ?")
    try {
      statement.setString(1, submissionId)
      val resultSet = statement.executeQuery()
      try if (resultSet.next()) Some(rowFromResultSet(resultSet)) else None
      finally resultSet.close()
    } finally {
      statement.close()
    }
  }

  def listPending(connection: Connection): Vector[BirdSubmissionRow] = {
    val statement = connection.prepareStatement(
      s"""
        $baseSelect
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
      while (resultSet.next()) builder += rowFromResultSet(resultSet)
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
      bindRow(statement, row)
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

  private def rowFromResultSet(resultSet: java.sql.ResultSet): BirdSubmissionRow =
    BirdSubmissionRow(
      id = resultSet.getString("id"),
      birdDesignId = resultSet.getString("bird_design_id"),
      submitterId = resultSet.getString("submitter_id"),
      status = SubmissionStatus.fromString(resultSet.getString("status")).getOrElse(SubmissionStatus.PendingReview),
      reviewerId = Option(resultSet.getString("reviewer_id")),
      reviewNote = Option(resultSet.getString("review_note")),
      submittedAt = resultSet.getString("submitted_at"),
      reviewedAt = Option(resultSet.getString("reviewed_at"))
    )

  private def bindRow(statement: java.sql.PreparedStatement, row: BirdSubmissionRow): Unit = {
    statement.setString(1, row.id)
    statement.setString(2, row.birdDesignId)
    statement.setString(3, row.submitterId)
    statement.setString(4, row.status.value)
    row.reviewerId match {
      case Some(value) => statement.setString(5, value)
      case None        => statement.setNull(5, java.sql.Types.VARCHAR)
    }
    row.reviewNote match {
      case Some(value) => statement.setString(6, value)
      case None        => statement.setNull(6, java.sql.Types.VARCHAR)
    }
    statement.setString(7, row.submittedAt)
    row.reviewedAt match {
      case Some(value) => statement.setString(8, value)
      case None        => statement.setNull(8, java.sql.Types.VARCHAR)
    }
  }

}
