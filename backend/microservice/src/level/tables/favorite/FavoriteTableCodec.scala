/** JDBC 读路径专用：SQL 列名 ↔ 收藏 Row 的编解码。
  *
  * 实现：baseSelect 复用 SELECT 片段；rowFromResultSet / bindRow 与 PostgreSQL snake_case 列对齐。
  */
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
