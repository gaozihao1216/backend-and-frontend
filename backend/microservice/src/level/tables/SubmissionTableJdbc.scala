package microservice.level.tables

import microservice.system.objects.SubmissionStatus
import java.sql.Connection

private[tables] object SubmissionTableJdbc {
  def initialize(connection: Connection): Unit =
    SubmissionTableJdbcSchema.initialize(connection)

  def listPending(connection: Connection): Vector[SubmissionRow] =
    SubmissionTableJdbcRead.listPending(connection)

  def listApproved(connection: Connection): Vector[SubmissionRow] =
    SubmissionTableJdbcRead.listApproved(connection)

  def hasPendingForLevel(connection: Connection, levelId: String): Boolean =
    SubmissionTableJdbcRead.hasPendingForLevel(connection, levelId)

  def nextId(connection: Connection): String =
    SubmissionTableJdbcRead.nextId(connection)

  def insert(connection: Connection, row: SubmissionRow): SubmissionRow =
    SubmissionTableJdbcWrite.insert(connection, row)

  def findById(connection: Connection, submissionId: String): Option[SubmissionRow] =
    SubmissionTableJdbcRead.findById(connection, submissionId)

  def updateReview(
    connection: Connection,
    submissionId: String,
    status: SubmissionStatus,
    reviewerId: String,
    reviewNote: Option[String],
    reviewedAt: String
  ): Option[SubmissionRow] =
    SubmissionTableJdbcWrite.updateReview(connection, submissionId, status, reviewerId, reviewNote, reviewedAt)
}
