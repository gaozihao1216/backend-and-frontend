package microservice.level.tables

import microservice.core.InMemoryStore
import microservice.system.objects.SubmissionStatus

private[tables] object SubmissionTableInMemory {
  def listPending(): Vector[SubmissionRow] =
    InMemoryStore.submissions.filter(_.status == SubmissionStatus.PendingReview)

  def hasPendingForLevel(levelId: String): Boolean =
    InMemoryStore.submissions.exists(submission => submission.levelId == levelId && submission.status == SubmissionStatus.PendingReview)

  def nextId(): String =
    s"submission-${InMemoryStore.submissions.size + 1}"

  def insert(row: SubmissionRow): SubmissionRow = {
    InMemoryStore.submissions = InMemoryStore.submissions :+ row
    row
  }

  def findById(submissionId: String): Option[SubmissionRow] =
    InMemoryStore.submissions.find(_.id == submissionId)

  def updateReview(
    submissionId: String,
    status: SubmissionStatus,
    reviewerId: String,
    reviewNote: Option[String],
    reviewedAt: String
  ): Option[SubmissionRow] =
    InMemoryStore.submissions.indexWhere(_.id == submissionId) match {
      case -1 => None
      case index =>
        val updated = InMemoryStore.submissions(index).copy(
          status = status,
          reviewerId = Some(reviewerId),
          reviewNote = reviewNote,
          reviewedAt = Some(reviewedAt)
        )
        InMemoryStore.submissions = InMemoryStore.submissions.updated(index, updated)
        Some(updated)
    }
}
