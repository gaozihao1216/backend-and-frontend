package microservice.level.tables

import microservice.system.objects.{LevelStatus, LevelTag}
import java.sql.Connection

object LevelTable {
  private def isInMemory(connection: Connection): Boolean =
    connection == null

  def initialize(connection: Connection): Unit =
    if (!isInMemory(connection)) LevelTableJdbcWrite.initialize(connection)

  def findById(connection: Connection, levelId: String): Option[LevelRow] =
    if (isInMemory(connection)) {
      LevelTableInMemory.findById(levelId)
    } else {
      LevelTableJdbcRead.findById(connection, levelId)
    }

  def nextId(connection: Connection): String =
    if (isInMemory(connection)) {
      LevelTableInMemory.nextId()
    } else {
      LevelTableJdbcRead.nextId(connection)
    }

  def listPublishedByAuthor(connection: Connection, authorId: String): Vector[LevelRow] =
    if (isInMemory(connection)) {
      LevelTableInMemory.listPublishedByAuthor(authorId)
    } else {
      LevelTableJdbcRead.listPublishedByAuthor(connection, authorId)
    }

  def listPublished(connection: Connection, tag: Option[LevelTag], sort: String): Vector[LevelRow] =
    if (isInMemory(connection)) {
      LevelTableInMemory.listPublished(tag, sort)
    } else {
      LevelTableJdbcRead.listPublished(connection, tag, sort)
    }

  def insert(connection: Connection, row: LevelRow): LevelRow =
    if (isInMemory(connection)) {
      LevelTableInMemory.insert(row)
    } else {
      LevelTableJdbcWrite.insert(connection, row)
    }

  def updateSubmissionStatus(
    connection: Connection,
    levelId: String,
    status: LevelStatus,
    rejectionReason: Option[String],
    updatedAt: String
  ): Option[LevelRow] =
    if (isInMemory(connection)) {
      LevelTableInMemory.updateSubmissionStatus(levelId, status, rejectionReason, updatedAt)
    } else {
      LevelTableJdbcWrite.updateSubmissionStatus(connection, levelId, status, rejectionReason, updatedAt)
    }

  def updateReviewStatus(
    connection: Connection,
    levelId: String,
    status: LevelStatus,
    rejectionReason: Option[String],
    publishedAt: Option[String],
    updatedAt: String
  ): Option[LevelRow] =
    if (isInMemory(connection)) {
      LevelTableInMemory.updateReviewStatus(levelId, status, rejectionReason, publishedAt, updatedAt)
    } else {
      LevelTableJdbcWrite.updateReviewStatus(connection, levelId, status, rejectionReason, publishedAt, updatedAt)
    }

  def updateRatingStats(
    connection: Connection,
    levelId: String,
    averageRating: Double,
    ratingCount: Int,
    updatedAt: String
  ): Option[LevelRow] =
    if (isInMemory(connection)) {
      LevelTableInMemory.updateRatingStats(levelId, averageRating, ratingCount, updatedAt)
    } else {
      LevelTableJdbcWrite.updateRatingStats(connection, levelId, averageRating, ratingCount, updatedAt)
    }
}
