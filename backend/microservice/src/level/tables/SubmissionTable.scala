package microservice.level.tables

import microservice.system.objects.SubmissionStatus
import java.sql.Connection

object SubmissionTable {
  private def isInMemory(connection: Connection): Boolean =
    connection == null

  def initialize(connection: Connection): Unit =
    if (!isInMemory(connection)) SubmissionTableJdbcSchema.initialize(connection)

  def listPending(connection: Connection): Vector[SubmissionRow] =
    if (isInMemory(connection)) SubmissionTableInMemory.listPending()
    else SubmissionTableJdbcRead.listPending(connection)

  def listApproved(connection: Connection): Vector[SubmissionRow] =
    if (isInMemory(connection)) SubmissionTableInMemory.listApproved()
    else SubmissionTableJdbcRead.listApproved(connection)

  def hasPendingForLevel(connection: Connection, levelId: String): Boolean =
    if (isInMemory(connection)) SubmissionTableInMemory.hasPendingForLevel(levelId)
    else SubmissionTableJdbcRead.hasPendingForLevel(connection, levelId)

  def nextId(connection: Connection): String =
    if (isInMemory(connection)) SubmissionTableInMemory.nextId()
    else SubmissionTableJdbcRead.nextId(connection)

  def insert(connection: Connection, row: SubmissionRow): SubmissionRow =
    if (isInMemory(connection)) SubmissionTableInMemory.insert(row)
    else SubmissionTableJdbcWrite.insert(connection, row)

  def findById(connection: Connection, submissionId: String): Option[SubmissionRow] =
    if (isInMemory(connection)) SubmissionTableInMemory.findById(submissionId)
    else SubmissionTableJdbcRead.findById(connection, submissionId)

  def updateReview(
    connection: Connection,
    submissionId: String,
    status: SubmissionStatus,
    reviewerId: String,
    reviewNote: Option[String],
    reviewedAt: String
  ): Option[SubmissionRow] =
    if (isInMemory(connection)) SubmissionTableInMemory.updateReview(submissionId, status, reviewerId, reviewNote, reviewedAt)
    else SubmissionTableJdbcWrite.updateReview(connection, submissionId, status, reviewerId, reviewNote, reviewedAt)
}
