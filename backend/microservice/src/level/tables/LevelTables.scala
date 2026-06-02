package microservice.level.tables

import microservice.core.InMemoryStore
import microservice.level.objects.Favorite
import microservice.level.objects.LevelData
import microservice.system.objects.{LevelStatus, LevelTag, SubmissionStatus}
import java.sql.Connection

final case class LevelRow(
  id: String,
  title: String,
  description: String,
  tags: List[LevelTag],
  data: LevelData,
  authorId: String,
  status: LevelStatus,
  rejectionReason: Option[String],
  averageRating: Double,
  ratingCount: Int,
  createdAt: String,
  updatedAt: String,
  publishedAt: Option[String]
)

final case class RatingRow(
  id: String,
  levelId: String,
  playerId: String,
  score: Int,
  createdAt: String,
  updatedAt: String
)

final case class CommentRow(
  id: String,
  levelId: String,
  userId: String,
  content: String,
  createdAt: String
)

final case class SubmissionRow(
  id: String,
  levelId: String,
  submitterId: String,
  status: SubmissionStatus,
  reviewerId: Option[String],
  reviewNote: Option[String],
  submittedAt: String,
  reviewedAt: Option[String]
)

object LevelTable {
  def all: Vector[LevelRow] =
    InMemoryStore.levels

  def count: Int =
    InMemoryStore.levels.size

  def findById(levelId: String): Option[LevelRow] =
    InMemoryStore.levels.find(_.id == levelId)

  def findById(connection: Connection, levelId: String): Option[LevelRow] =
    findById(levelId)

  def listPublishedByAuthor(connection: Connection, authorId: String): Vector[LevelRow] =
    InMemoryStore.levels.filter(level => level.authorId == authorId && level.status == LevelStatus.Published)

  def indexWhere(predicate: LevelRow => Boolean): Int =
    InMemoryStore.levels.indexWhere(predicate)

  def insert(row: LevelRow): LevelRow = {
    InMemoryStore.levels = InMemoryStore.levels :+ row
    row
  }

  def update(index: Int, row: LevelRow): LevelRow = {
    InMemoryStore.levels = InMemoryStore.levels.updated(index, row)
    row
  }

  def updateReviewStatus(
    connection: Connection,
    levelId: String,
    status: LevelStatus,
    rejectionReason: Option[String],
    publishedAt: Option[String],
    updatedAt: String
  ): Option[LevelRow] =
    InMemoryStore.levels.indexWhere(_.id == levelId) match {
      case -1 => None
      case index =>
        val updated = InMemoryStore.levels(index).copy(
          status = status,
          rejectionReason = rejectionReason,
          publishedAt = publishedAt,
          updatedAt = updatedAt
        )
        InMemoryStore.levels = InMemoryStore.levels.updated(index, updated)
        Some(updated)
    }
}

object RatingTable {
  def all: Vector[RatingRow] =
    InMemoryStore.ratings

  def countByPlayer(connection: Connection, playerId: String): Int =
    InMemoryStore.ratings.count(_.playerId == playerId)

  def count: Int =
    InMemoryStore.ratings.size

  def indexWhere(predicate: RatingRow => Boolean): Int =
    InMemoryStore.ratings.indexWhere(predicate)

  def insert(row: RatingRow): RatingRow = {
    InMemoryStore.ratings = InMemoryStore.ratings :+ row
    row
  }

  def update(index: Int, row: RatingRow): RatingRow = {
    InMemoryStore.ratings = InMemoryStore.ratings.updated(index, row)
    row
  }
}

object CommentTable {
  def all: Vector[CommentRow] =
    InMemoryStore.comments

  def listAllForAdmin(connection: Connection): Vector[CommentRow] =
    InMemoryStore.comments.sortBy(_.createdAt)(Ordering[String].reverse)

  def listRecentByUser(connection: Connection, userId: String, limit: Int): Vector[CommentRow] =
    InMemoryStore.comments
      .filter(_.userId == userId)
      .sortBy(_.createdAt)(Ordering[String].reverse)
      .take(limit)

  def count: Int =
    InMemoryStore.comments.size

  def insert(row: CommentRow): CommentRow = {
    InMemoryStore.comments = InMemoryStore.comments :+ row
    row
  }

  def deleteById(commentId: String): Option[CommentRow] =
    InMemoryStore.comments.indexWhere(_.id == commentId) match {
      case -1 => None
      case index =>
        val deleted = InMemoryStore.comments(index)
        InMemoryStore.comments = InMemoryStore.comments.patch(index, Nil, 1)
        Some(deleted)
    }

  def deleteById(connection: Connection, commentId: String): Option[CommentRow] =
    deleteById(commentId)
}

object SubmissionTable {
  def all: Vector[SubmissionRow] =
    InMemoryStore.submissions

  def listPending(connection: Connection): Vector[SubmissionRow] =
    InMemoryStore.submissions.filter(_.status == SubmissionStatus.PendingReview)

  def count: Int =
    InMemoryStore.submissions.size

  def exists(predicate: SubmissionRow => Boolean): Boolean =
    InMemoryStore.submissions.exists(predicate)

  def indexWhere(predicate: SubmissionRow => Boolean): Int =
    InMemoryStore.submissions.indexWhere(predicate)

  def insert(row: SubmissionRow): SubmissionRow = {
    InMemoryStore.submissions = InMemoryStore.submissions :+ row
    row
  }

  def update(index: Int, row: SubmissionRow): SubmissionRow = {
    InMemoryStore.submissions = InMemoryStore.submissions.updated(index, row)
    row
  }

  def findById(connection: Connection, submissionId: String): Option[SubmissionRow] =
    InMemoryStore.submissions.find(_.id == submissionId)

  def updateReview(
    connection: Connection,
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

object FavoriteTable {
  def all: Vector[Favorite] =
    InMemoryStore.favorites

  def countByUser(connection: Connection, userId: String): Int =
    InMemoryStore.favorites.count(_.userId == userId)

  def count: Int =
    InMemoryStore.favorites.size

  def find(userId: String, levelId: String): Option[Favorite] =
    InMemoryStore.favorites.find(favorite => favorite.userId == userId && favorite.levelId == levelId)

  def insert(favorite: Favorite): Favorite = {
    InMemoryStore.favorites = InMemoryStore.favorites :+ favorite
    favorite
  }

  def delete(userId: String, levelId: String): Option[Favorite] =
    InMemoryStore.favorites.indexWhere(favorite => favorite.userId == userId && favorite.levelId == levelId) match {
      case -1 => None
      case index =>
        val deleted = InMemoryStore.favorites(index)
        InMemoryStore.favorites = InMemoryStore.favorites.patch(index, Nil, 1)
        Some(deleted)
    }
}
