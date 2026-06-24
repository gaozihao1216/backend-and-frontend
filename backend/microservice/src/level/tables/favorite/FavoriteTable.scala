package microservice.level.tables.favorite

import java.sql.Connection
import microservice.level.objects.social.Favorite
import microservice.level.tables.favorite._
import microservice.level.tables.shared.LevelRow
import microservice.system.objects.LevelStatus
import microservice.level.tables.level.LevelTable

object FavoriteTable {

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
          LevelTable
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

def insert(connection: Connection, favorite: Favorite): Favorite = {
    val statement = connection.prepareStatement(
      """
        INSERT INTO favorites (id, level_id, user_id, created_at)
        VALUES (?, ?, ?, ?)
      """
    )
    try {
      statement.setString(1, favorite.id)
      statement.setString(2, favorite.levelId)
      statement.setString(3, favorite.userId)
      statement.setString(4, favorite.createdAt)
      statement.executeUpdate()
      favorite
    } finally {
      statement.close()
    }
  }

  def delete(connection: Connection, userId: String, levelId: String): Option[Favorite] =
    FavoriteTable.find(connection, userId, levelId).flatMap { favorite =>
      val statement = connection.prepareStatement("DELETE FROM favorites WHERE user_id = ? AND level_id = ?")
      try {
        statement.setString(1, userId)
        statement.setString(2, levelId)
        if (statement.executeUpdate() == 0) None else Some(favorite)
      } finally {
        statement.close()
      }
    }
}
