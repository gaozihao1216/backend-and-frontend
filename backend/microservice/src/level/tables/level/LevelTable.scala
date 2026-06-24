package microservice.level.tables.level

import java.sql.Connection
import microservice.level.tables.level.LevelTableCodec
import microservice.level.tables.shared.LevelRow
import microservice.system.objects.{LevelStatus, LevelTag}

/** levels 表的 JDBC 实现：DDL、查询与写入均在此对象内完成，不再经 Write/Insert/Update 中转。 */
object LevelTable {

  def findById(connection: Connection, levelId: String): Option[LevelRow] = {
    val statement = connection.prepareStatement(s"${LevelTableCodec.baseSelect} WHERE id = ?")
    try {
      statement.setString(1, levelId)
      val resultSet = statement.executeQuery()
      try {
        if (resultSet.next()) Some(LevelTableCodec.rowFromResultSet(resultSet)) else None
      } finally {
        resultSet.close()
      }
    } finally {
      statement.close()
    }
  }

  def nextId(connection: Connection): String = {
    val statement = connection.prepareStatement("SELECT COUNT(*) AS level_count FROM levels")
    try {
      val resultSet = statement.executeQuery()
      try {
        if (resultSet.next()) s"level-${resultSet.getInt("level_count") + 1}" else "level-1"
      } finally {
        resultSet.close()
      }
    } finally {
      statement.close()
    }
  }

  def listPublishedByAuthor(connection: Connection, authorId: String): Vector[LevelRow] = {
    val statement = connection.prepareStatement(
      s"""
        ${LevelTableCodec.baseSelect}
        WHERE author_id = ? AND status = ?
        ORDER BY created_at DESC, id ASC
      """
    )
    try {
      statement.setString(1, authorId)
      statement.setString(2, LevelStatus.Published.value)
      rows(statement.executeQuery())
    } finally {
      statement.close()
    }
  }

  def listPublished(connection: Connection, tag: Option[LevelTag], sort: String): Vector[LevelRow] = {
    val orderBy = sort match {
      case "highestRated" => "average_rating DESC, rating_count DESC, created_at ASC, id ASC"
      case "mostRated" => "rating_count DESC, average_rating DESC, created_at ASC, id ASC"
      case _ => "created_at DESC, id ASC"
    }
    val tagFilter = tag.map(_ => " AND (',' || tags || ',') LIKE ?").getOrElse("")
    val statement = connection.prepareStatement(
      s"""
        ${LevelTableCodec.baseSelect}
        WHERE status = ?$tagFilter
        ORDER BY $orderBy
      """
    )
    try {
      statement.setString(1, LevelStatus.Published.value)
      tag.foreach(value => statement.setString(2, s"%,${value.value},%"))
      rows(statement.executeQuery())
    } finally {
      statement.close()
    }
  }

  def insert(connection: Connection, row: LevelRow): LevelRow = {
    val statement = connection.prepareStatement(
      """
        INSERT INTO levels (
          id, title, description, tags, data, author_id, status, rejection_reason,
          average_rating, rating_count, created_at, updated_at, published_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      """
    )
    try {
      statement.setString(1, row.id)
      statement.setString(2, row.title)
      statement.setString(3, row.description)
      statement.setString(4, LevelTableCodec.tagsToDb(row.tags))
      statement.setString(5, LevelTableCodec.levelDataToDb(row.data))
      statement.setString(6, row.authorId)
      statement.setString(7, row.status.value)
      LevelTableCodec.setNullableString(statement, 8, row.rejectionReason)
      statement.setDouble(9, row.averageRating)
      statement.setInt(10, row.ratingCount)
      statement.setString(11, row.createdAt)
      statement.setString(12, row.updatedAt)
      LevelTableCodec.setNullableString(statement, 13, row.publishedAt)
      statement.executeUpdate()
      row
    } finally {
      statement.close()
    }
  }

  def updateSubmissionStatus(
    connection: Connection,
    levelId: String,
    status: LevelStatus,
    rejectionReason: Option[String],
    updatedAt: String
  ): Option[LevelRow] =
    updateAndRead(connection, levelId) {
      val statement = connection.prepareStatement(
        """
          UPDATE levels
          SET status = ?, rejection_reason = ?, updated_at = ?
          WHERE id = ?
        """
      )
      statement.setString(1, status.value)
      LevelTableCodec.setNullableString(statement, 2, rejectionReason)
      statement.setString(3, updatedAt)
      statement.setString(4, levelId)
      statement
    }

  def updateReviewStatus(
    connection: Connection,
    levelId: String,
    status: LevelStatus,
    rejectionReason: Option[String],
    publishedAt: Option[String],
    updatedAt: String
  ): Option[LevelRow] =
    updateAndRead(connection, levelId) {
      val statement = connection.prepareStatement(
        """
          UPDATE levels
          SET status = ?, rejection_reason = ?, published_at = ?, updated_at = ?
          WHERE id = ?
        """
      )
      statement.setString(1, status.value)
      LevelTableCodec.setNullableString(statement, 2, rejectionReason)
      LevelTableCodec.setNullableString(statement, 3, publishedAt)
      statement.setString(4, updatedAt)
      statement.setString(5, levelId)
      statement
    }

  def updateRatingStats(
    connection: Connection,
    levelId: String,
    averageRating: Double,
    ratingCount: Int,
    updatedAt: String
  ): Option[LevelRow] =
    updateAndRead(connection, levelId) {
      val statement = connection.prepareStatement(
        """
          UPDATE levels
          SET average_rating = ?, rating_count = ?, updated_at = ?
          WHERE id = ?
        """
      )
      statement.setDouble(1, averageRating)
      statement.setInt(2, ratingCount)
      statement.setString(3, updatedAt)
      statement.setString(4, levelId)
      statement
    }

  private def updateAndRead(
    connection: Connection,
    levelId: String
  )(statementFactory: => java.sql.PreparedStatement): Option[LevelRow] = {
    val statement = statementFactory
    try {
      if (statement.executeUpdate() == 0) None else findById(connection, levelId)
    } finally {
      statement.close()
    }
  }

  private def rows(resultSet: java.sql.ResultSet): Vector[LevelRow] =
    try {
      val builder = Vector.newBuilder[LevelRow]
      while (resultSet.next()) {
        builder += LevelTableCodec.rowFromResultSet(resultSet)
      }
      builder.result()
    } finally {
      resultSet.close()
    }
}
