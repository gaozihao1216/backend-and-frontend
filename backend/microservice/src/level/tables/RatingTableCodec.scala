package microservice.level.tables

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
