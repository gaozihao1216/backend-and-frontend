package microservice.level.tables.level

import java.sql.Connection
import microservice.infrastructure.database.{InMemoryStore, TableConnection}
import microservice.level.tables.level.jdbc.LevelTableJdbc
import microservice.level.tables.shared.LevelRow
import microservice.system.objects.{LevelStatus, LevelTag}

/** 关卡表访问：in-memory 直接读写 [[InMemoryStore]]；JDBC 直接调用 [[LevelTableJdbc]]。 */
object LevelTable {
  def initialize(connection: Connection): Unit =
    if (!TableConnection.isInMemory(connection)) LevelTableJdbc.initialize(connection)

  def findById(connection: Connection, levelId: String): Option[LevelRow] =
    if (TableConnection.isInMemory(connection)) {
      InMemoryStore.levels.find(_.id == levelId)
    } else {
      LevelTableJdbc.findById(connection, levelId)
    }

  def nextId(connection: Connection): String =
    if (TableConnection.isInMemory(connection)) {
      s"level-${InMemoryStore.levels.size + 1}"
    } else {
      LevelTableJdbc.nextId(connection)
    }

  def listPublishedByAuthor(connection: Connection, authorId: String): Vector[LevelRow] =
    if (TableConnection.isInMemory(connection)) {
      InMemoryStore.levels.filter(level => level.authorId == authorId && level.status == LevelStatus.Published)
    } else {
      LevelTableJdbc.listPublishedByAuthor(connection, authorId)
    }

  def listPublished(connection: Connection, tag: Option[LevelTag], sort: String): Vector[LevelRow] =
    if (TableConnection.isInMemory(connection)) {
      val filtered = InMemoryStore.levels.filter(level =>
        level.status == LevelStatus.Published && tag.forall(level.tags.contains)
      )
      sort match {
        case "highestRated" => filtered.sortBy(level => (-level.averageRating, -level.ratingCount, level.createdAt))
        case "mostRated" => filtered.sortBy(level => (-level.ratingCount, -level.averageRating, level.createdAt))
        case _ => filtered.sortBy(_.createdAt)(Ordering[String].reverse)
      }
    } else {
      LevelTableJdbc.listPublished(connection, tag, sort)
    }

  def insert(connection: Connection, row: LevelRow): LevelRow =
    if (TableConnection.isInMemory(connection)) {
      InMemoryStore.levels = InMemoryStore.levels :+ row
      row
    } else {
      LevelTableJdbc.insert(connection, row)
    }

  def updateSubmissionStatus(
    connection: Connection,
    levelId: String,
    status: LevelStatus,
    rejectionReason: Option[String],
    updatedAt: String
  ): Option[LevelRow] =
    if (TableConnection.isInMemory(connection)) {
      updateInMemoryById(levelId)(_.copy(status = status, rejectionReason = rejectionReason, updatedAt = updatedAt))
    } else {
      LevelTableJdbc.updateSubmissionStatus(connection, levelId, status, rejectionReason, updatedAt)
    }

  def updateReviewStatus(
    connection: Connection,
    levelId: String,
    status: LevelStatus,
    rejectionReason: Option[String],
    publishedAt: Option[String],
    updatedAt: String
  ): Option[LevelRow] =
    if (TableConnection.isInMemory(connection)) {
      updateInMemoryById(levelId)(_.copy(
        status = status,
        rejectionReason = rejectionReason,
        publishedAt = publishedAt,
        updatedAt = updatedAt
      ))
    } else {
      LevelTableJdbc.updateReviewStatus(connection, levelId, status, rejectionReason, publishedAt, updatedAt)
    }

  def updateRatingStats(
    connection: Connection,
    levelId: String,
    averageRating: Double,
    ratingCount: Int,
    updatedAt: String
  ): Option[LevelRow] =
    if (TableConnection.isInMemory(connection)) {
      updateInMemoryById(levelId)(_.copy(averageRating = averageRating, ratingCount = ratingCount, updatedAt = updatedAt))
    } else {
      LevelTableJdbc.updateRatingStats(connection, levelId, averageRating, ratingCount, updatedAt)
    }

  private def updateInMemoryById(levelId: String)(update: LevelRow => LevelRow): Option[LevelRow] =
    InMemoryStore.levels.indexWhere(_.id == levelId) match {
      case -1 => None
      case index =>
        val updated = update(InMemoryStore.levels(index))
        InMemoryStore.levels = InMemoryStore.levels.updated(index, updated)
        Some(updated)
    }
}
