package microservice.level.tables

import microservice.system.objects.{LevelStatus, LevelTag}
import java.sql.Connection

private[tables] object LevelTableJdbc {
  def initialize(connection: Connection): Unit =
    LevelTableJdbcWrite.initialize(connection)

  def findById(connection: Connection, levelId: String): Option[LevelRow] =
    LevelTableJdbcRead.findById(connection, levelId)

  def nextId(connection: Connection): String =
    LevelTableJdbcRead.nextId(connection)

  def listPublishedByAuthor(connection: Connection, authorId: String): Vector[LevelRow] =
    LevelTableJdbcRead.listPublishedByAuthor(connection, authorId)

  def listPublished(connection: Connection, tag: Option[LevelTag], sort: String): Vector[LevelRow] =
    LevelTableJdbcRead.listPublished(connection, tag, sort)

  def insert(connection: Connection, row: LevelRow): LevelRow =
    LevelTableJdbcWrite.insert(connection, row)

  def updateSubmissionStatus(
    connection: Connection,
    levelId: String,
    status: LevelStatus,
    rejectionReason: Option[String],
    updatedAt: String
  ): Option[LevelRow] =
    LevelTableJdbcWrite.updateSubmissionStatus(connection, levelId, status, rejectionReason, updatedAt)

  def updateReviewStatus(
    connection: Connection,
    levelId: String,
    status: LevelStatus,
    rejectionReason: Option[String],
    publishedAt: Option[String],
    updatedAt: String
  ): Option[LevelRow] =
    LevelTableJdbcWrite.updateReviewStatus(connection, levelId, status, rejectionReason, publishedAt, updatedAt)

  def updateRatingStats(
    connection: Connection,
    levelId: String,
    averageRating: Double,
    ratingCount: Int,
    updatedAt: String
  ): Option[LevelRow] =
    LevelTableJdbcWrite.updateRatingStats(connection, levelId, averageRating, ratingCount, updatedAt)
}
