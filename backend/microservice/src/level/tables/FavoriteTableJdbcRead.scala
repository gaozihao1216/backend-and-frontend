package microservice.level.tables

import java.sql.Connection
import microservice.level.objects.Favorite
import microservice.system.objects.LevelStatus

private[tables] object FavoriteTableJdbcRead {
  def countByUser(connection: Connection, userId: String): Int = {
    val statement = connection.prepareStatement("SELECT COUNT(*) AS favorite_count FROM favorites WHERE user_id = ?")
    try {
      statement.setString(1, userId)
      val resultSet = statement.executeQuery()
      try {
        if (resultSet.next()) resultSet.getInt("favorite_count") else 0
      } finally {
        resultSet.close()
      }
    } finally {
      statement.close()
    }
  }

  def listPublishedByUser(connection: Connection, userId: String): Vector[(Favorite, LevelRow)] = {
    val statement = connection.prepareStatement(
      s"${FavoriteTableCodec.baseSelect} WHERE user_id = ? ORDER BY created_at DESC, id ASC"
    )
    try {
      statement.setString(1, userId)
      val resultSet = statement.executeQuery()
      try {
        val favorites = Vector.newBuilder[Favorite]
        while (resultSet.next()) {
          favorites += FavoriteTableCodec.rowFromResultSet(resultSet)
        }
        favorites.result().flatMap(favorite =>
          LevelTableJdbcRead
            .findById(connection, favorite.levelId)
            .filter(_.status == LevelStatus.Published)
            .map(level => favorite -> level)
        )
      } finally {
        resultSet.close()
      }
    } finally {
      statement.close()
    }
  }

  def find(connection: Connection, userId: String, levelId: String): Option[Favorite] = {
    val statement = connection.prepareStatement(s"${FavoriteTableCodec.baseSelect} WHERE user_id = ? AND level_id = ?")
    try {
      statement.setString(1, userId)
      statement.setString(2, levelId)
      val resultSet = statement.executeQuery()
      try {
        if (resultSet.next()) Some(FavoriteTableCodec.rowFromResultSet(resultSet)) else None
      } finally {
        resultSet.close()
      }
    } finally {
      statement.close()
    }
  }

  def nextId(connection: Connection): String = {
    val statement = connection.prepareStatement("SELECT COUNT(*) AS favorite_count FROM favorites")
    try {
      val resultSet = statement.executeQuery()
      try {
        if (resultSet.next()) s"favorite-${resultSet.getInt("favorite_count") + 1}" else "favorite-1"
      } finally {
        resultSet.close()
      }
    } finally {
      statement.close()
    }
  }
}
