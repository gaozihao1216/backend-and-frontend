package microservice.level.tables.level

import microservice.level.tables.shared.LevelRow

import microservice.level.tables.level.inmemory._
import microservice.level.tables.level.jdbc._

import microservice.system.objects.{LevelStatus, LevelTag}
import java.sql.Connection

/** 关卡表访问门面：根据 connection 是否为 null 在 in-memory 与 JDBC 实现间分流。
  *
  * 实现：isInMemory(connection) 为 true 时走 LevelTableInMemory + InMemoryStore；
  *       否则走 LevelTableJdbcRead/Write（PostgreSQL）。
  * 关联：CreateLevel、ReviewSubmission、RateLevel 等 APIMessage 均通过此对象读写 LevelRow。
  */
object LevelTable {
  private def isInMemory(connection: Connection): Boolean =
    connection == null

  /** JDBC 启动时建表；in-memory 模式下无需 DDL。 */
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
