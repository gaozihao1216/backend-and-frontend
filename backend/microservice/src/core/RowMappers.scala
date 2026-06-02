package microservice.core

import microservice.auth.objects.BackendUser
import microservice.auth.tables.UserRow
import microservice.level.objects.{Level, LevelComment, Rating, Submission}
import microservice.level.tables.{CommentRow, LevelRow, RatingRow, SubmissionRow}

object RowMappers {
  def toBackendUser(row: UserRow): BackendUser =
    BackendUser(row.id, row.username, row.displayName, row.role, row.createdAt, row.updatedAt)

  def toLevel(row: LevelRow): Level =
    Level(
      row.id,
      row.title,
      row.description,
      row.tags,
      row.data,
      row.authorId,
      row.status,
      row.rejectionReason,
      row.averageRating,
      row.ratingCount,
      row.createdAt,
      row.updatedAt,
      row.publishedAt
    )

  def toRating(row: RatingRow): Rating =
    Rating(row.id, row.levelId, row.playerId, row.score, row.createdAt, row.updatedAt)

  def toComment(row: CommentRow): LevelComment =
    LevelComment(row.id, row.levelId, row.userId, row.content, row.createdAt)

  def toSubmission(row: SubmissionRow): Submission =
    Submission(
      row.id,
      row.levelId,
      row.submitterId,
      row.status,
      row.reviewerId,
      row.reviewNote,
      row.submittedAt,
      row.reviewedAt
    )
}
