/** 评分表的 JDBC 写操作（INSERT/UPDATE/DELETE）。
  *
  * 实现：PreparedStatement + Codec.bindRow；写成功后必要时 re-read 返回最新行。
  */
package microservice.level.tables.rating.jdbc

import microservice.level.tables.shared.RatingRow

import microservice.level.tables.rating._

import java.sql.Connection

private[tables] object RatingTableJdbcWrite {
  def insert(connection: Connection, row: RatingRow): RatingRow = {
    val statement = connection.prepareStatement(
      """
        INSERT INTO ratings (id, level_id, player_id, score, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      """
    )
    try {
      statement.setString(1, row.id)
      statement.setString(2, row.levelId)
      statement.setString(3, row.playerId)
      statement.setInt(4, row.score)
      statement.setString(5, row.createdAt)
      statement.setString(6, row.updatedAt)
      statement.executeUpdate()
      row
    } finally {
      statement.close()
    }
  }

  def updateScore(connection: Connection, ratingId: String, score: Int, updatedAt: String): Option[RatingRow] = {
    val statement = connection.prepareStatement(
      """
        UPDATE ratings
        SET score = ?, updated_at = ?
        WHERE id = ?
      """
    )
    try {
      statement.setInt(1, score)
      statement.setString(2, updatedAt)
      statement.setString(3, ratingId)
      if (statement.executeUpdate() == 0) None else RatingTableJdbcRead.findById(connection, ratingId)
    } finally {
      statement.close()
    }
  }
}
