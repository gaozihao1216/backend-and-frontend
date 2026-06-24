/** JDBC 读路径专用：SQL 列名 ↔ 评分 Row 的编解码。
  *
  * 实现：baseSelect 复用 SELECT 片段；rowFromResultSet / bindRow 与 PostgreSQL snake_case 列对齐。
  */
package microservice.level.tables.rating

/** RatingTableCodec 表访问门面。
  *
  * 表职责：封装 ratingcodec 数据的 CRUD。
  * Row↔Object 映射：通过 RowMapper/Codec 与领域对象互转。
  * JDBC 表字段编解码：负责 ResultSet 映射与 SQL 参数绑定。
  */
import microservice.level.tables.shared.RatingRow

import java.sql.ResultSet

private[tables] object RatingTableCodec {
  val baseSelect: String =
    """
      SELECT id, level_id, player_id, score, created_at, updated_at
      FROM ratings
    """

  def rowFromResultSet(resultSet: ResultSet): RatingRow =
    RatingRow(
      id = resultSet.getString("id"),
      levelId = resultSet.getString("level_id"),
      playerId = resultSet.getString("player_id"),
      score = resultSet.getInt("score"),
      createdAt = resultSet.getString("created_at"),
      updatedAt = resultSet.getString("updated_at")
    )
}
