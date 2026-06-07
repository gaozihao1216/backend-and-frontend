package microservice.level.tables

import microservice.system.objects.SubmissionStatus
import java.sql.Connection

object SubmissionTable {
  private def isInMemory(connection: Connection): Boolean =
    connection == null

  def initialize(connection: Connection): Unit =
    if (!isInMemory(connection)) SubmissionTableJdbc.initialize(connection)

  def listPending(connection: Connection): Vector[SubmissionRow] =
    if (isInMemory(connection)) SubmissionTableInMemory.listPending()
    else SubmissionTableJdbc.listPending(connection)

  def listApproved(connection: Connection): Vector[SubmissionRow] =
    if (isInMemory(connection)) SubmissionTableInMemory.listApproved()
    else SubmissionTableJdbc.listApproved(connection)

  def hasPendingForLevel(connection: Connection, levelId: String): Boolean =
    if (isInMemory(connection)) SubmissionTableInMemory.hasPendingForLevel(levelId)
    else SubmissionTableJdbc.hasPendingForLevel(connection, levelId)

  def nextId(connection: Connection): String =
    if (isInMemory(connection)) SubmissionTableInMemory.nextId()
    else SubmissionTableJdbc.nextId(connection)

  def insert(connection: Connection, row: SubmissionRow): SubmissionRow =
    if (isInMemory(connection)) SubmissionTableInMemory.insert(row)
    else SubmissionTableJdbc.insert(connection, row)

  def findById(connection: Connection, submissionId: String): Option[SubmissionRow] =
    if (isInMemory(connection)) SubmissionTableInMemory.findById(submissionId)
    else SubmissionTableJdbc.findById(connection, submissionId)

  def updateReview(
    connection: Connection,
    submissionId: String,
    status: SubmissionStatus,
    reviewerId: String,
    reviewNote: Option[String],
    reviewedAt: String
  ): Option[SubmissionRow] =
    if (isInMemory(connection)) SubmissionTableInMemory.updateReview(submissionId, status, reviewerId, reviewNote, reviewedAt)
    else SubmissionTableJdbc.updateReview(connection, submissionId, status, reviewerId, reviewNote, reviewedAt)
}
