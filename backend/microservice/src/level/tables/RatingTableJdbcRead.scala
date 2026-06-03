package microservice.level.tables

import java.sql.Connection

private[tables] object RatingTableJdbcRead {
  def countByPlayer(connection: Connection, playerId: String): Int = {
    val statement = connection.prepareStatement("SELECT COUNT(*) AS rating_count FROM ratings WHERE player_id = ?")
    try {
      statement.setString(1, playerId)
      val resultSet = statement.executeQuery()
      try {
        if (resultSet.next()) resultSet.getInt("rating_count") else 0
      } finally {
        resultSet.close()
      }
    } finally {
      statement.close()
    }
  }

  def findByLevelAndPlayer(connection: Connection, levelId: String, playerId: String): Option[RatingRow] = {
    val statement = connection.prepareStatement(s"${RatingTableCodec.baseSelect} WHERE level_id = ? AND player_id = ?")
    try {
      statement.setString(1, levelId)
      statement.setString(2, playerId)
      val resultSet = statement.executeQuery()
      try {
        if (resultSet.next()) Some(RatingTableCodec.rowFromResultSet(resultSet)) else None
      } finally {
        resultSet.close()
      }
    } finally {
      statement.close()
    }
  }

  def listByLevel(connection: Connection, levelId: String): Vector[RatingRow] = {
    val statement = connection.prepareStatement(s"${RatingTableCodec.baseSelect} WHERE level_id = ? ORDER BY created_at ASC, id ASC")
    try {
      statement.setString(1, levelId)
      rows(statement.executeQuery())
    } finally {
      statement.close()
    }
  }

  def nextId(connection: Connection): String = {
    val statement = connection.prepareStatement("SELECT COUNT(*) AS rating_count FROM ratings")
    try {
      val resultSet = statement.executeQuery()
      try {
        if (resultSet.next()) s"rating-${resultSet.getInt("rating_count") + 1}" else "rating-1"
      } finally {
        resultSet.close()
      }
    } finally {
      statement.close()
    }
  }

  def findById(connection: Connection, ratingId: String): Option[RatingRow] = {
    val statement = connection.prepareStatement(s"${RatingTableCodec.baseSelect} WHERE id = ?")
    try {
      statement.setString(1, ratingId)
      val resultSet = statement.executeQuery()
      try {
        if (resultSet.next()) Some(RatingTableCodec.rowFromResultSet(resultSet)) else None
      } finally {
        resultSet.close()
      }
    } finally {
      statement.close()
    }
  }

  private def rows(resultSet: java.sql.ResultSet): Vector[RatingRow] =
    try {
      val builder = Vector.newBuilder[RatingRow]
      while (resultSet.next()) {
        builder += RatingTableCodec.rowFromResultSet(resultSet)
      }
      builder.result()
    } finally {
      resultSet.close()
    }
}
