/** 收藏表的 JDBC 写操作（INSERT/UPDATE/DELETE）。
  *
  * 实现：PreparedStatement + Codec.bindRow；写成功后必要时 re-read 返回最新行。
  */
package microservice.level.tables.favorite.jdbc

import microservice.level.tables.shared.LevelRow

import microservice.level.tables.favorite._

import java.sql.Connection
import microservice.level.objects.Favorite

private[tables] object FavoriteTableJdbcWrite {
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
    FavoriteTableJdbcRead.find(connection, userId, levelId).flatMap { favorite =>
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
