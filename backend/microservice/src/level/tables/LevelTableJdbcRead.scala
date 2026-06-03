package microservice.level.tables

import microservice.system.objects.{LevelStatus, LevelTag}
import java.sql.Connection

private[tables] object LevelTableJdbcRead {
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
