package microservice.level.tables.favorite

import microservice.level.tables.shared.LevelRow

import java.sql.ResultSet
import microservice.level.objects.Favorite

private[tables] object FavoriteTableCodec {
  val baseSelect: String =
    """
      SELECT id, level_id, user_id, created_at
      FROM favorites
    """

  def rowFromResultSet(resultSet: ResultSet): Favorite =
    Favorite(
      id = resultSet.getString("id"),
      levelId = resultSet.getString("level_id"),
      userId = resultSet.getString("user_id"),
      createdAt = resultSet.getString("created_at")
    )
}
