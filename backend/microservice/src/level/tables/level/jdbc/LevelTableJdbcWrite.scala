package microservice.level.tables.level.jdbc

import microservice.level.tables.shared.LevelRow

import microservice.level.tables.level._

import microservice.system.objects.LevelStatus
import java.sql.Connection

private[tables] object LevelTableJdbcWrite {
  def initialize(connection: Connection): Unit =
    LevelTableJdbcSchema.initialize(connection)

  def insert(connection: Connection, row: LevelRow): LevelRow =
    LevelTableJdbcInsert.insert(connection, row)

  def updateSubmissionStatus(
    connection: Connection,
    levelId: String,
    status: LevelStatus,
    rejectionReason: Option[String],
    updatedAt: String
  ): Option[LevelRow] =
    LevelTableJdbcUpdate.updateSubmissionStatus(connection, levelId, status, rejectionReason, updatedAt)

  def updateReviewStatus(
    connection: Connection,
    levelId: String,
    status: LevelStatus,
    rejectionReason: Option[String],
    publishedAt: Option[String],
    updatedAt: String
  ): Option[LevelRow] =
    LevelTableJdbcUpdate.updateReviewStatus(connection, levelId, status, rejectionReason, publishedAt, updatedAt)

  def updateRatingStats(
    connection: Connection,
    levelId: String,
    averageRating: Double,
    ratingCount: Int,
    updatedAt: String
  ): Option[LevelRow] =
    LevelTableJdbcUpdate.updateRatingStats(connection, levelId, averageRating, ratingCount, updatedAt)
}
