/** 关卡表的 JDBC 更新专用路径。
  *
  * 实现：与 JdbcWrite 互补，负责已有行的 UPDATE 逻辑。
  */
package microservice.level.tables.level.jdbc

import microservice.level.tables.shared.LevelRow

import microservice.level.tables.level._

import microservice.system.objects.LevelStatus
import java.sql.Connection

private[tables] object LevelTableJdbcUpdate {
  def updateSubmissionStatus(
    connection: Connection,
    levelId: String,
    status: LevelStatus,
    rejectionReason: Option[String],
    updatedAt: String
  ): Option[LevelRow] =
    updateAndRead(connection, levelId) {
      val statement = connection.prepareStatement(
        """
          UPDATE levels
          SET status = ?, rejection_reason = ?, updated_at = ?
          WHERE id = ?
        """
      )
      statement.setString(1, status.value)
      LevelTableCodec.setNullableString(statement, 2, rejectionReason)
      statement.setString(3, updatedAt)
      statement.setString(4, levelId)
      statement
    }

  def updateReviewStatus(
    connection: Connection,
    levelId: String,
    status: LevelStatus,
    rejectionReason: Option[String],
    publishedAt: Option[String],
    updatedAt: String
  ): Option[LevelRow] =
    updateAndRead(connection, levelId) {
      val statement = connection.prepareStatement(
        """
          UPDATE levels
          SET status = ?, rejection_reason = ?, published_at = ?, updated_at = ?
          WHERE id = ?
        """
      )
      statement.setString(1, status.value)
      LevelTableCodec.setNullableString(statement, 2, rejectionReason)
      LevelTableCodec.setNullableString(statement, 3, publishedAt)
      statement.setString(4, updatedAt)
      statement.setString(5, levelId)
      statement
    }

  def updateRatingStats(
    connection: Connection,
    levelId: String,
    averageRating: Double,
    ratingCount: Int,
    updatedAt: String
  ): Option[LevelRow] =
    updateAndRead(connection, levelId) {
      val statement = connection.prepareStatement(
        """
          UPDATE levels
          SET average_rating = ?, rating_count = ?, updated_at = ?
          WHERE id = ?
        """
      )
      statement.setDouble(1, averageRating)
      statement.setInt(2, ratingCount)
      statement.setString(3, updatedAt)
      statement.setString(4, levelId)
      statement
    }

  private def updateAndRead(
    connection: Connection,
    levelId: String
  )(statementFactory: => java.sql.PreparedStatement): Option[LevelRow] = {
    val statement = statementFactory
    try {
      if (statement.executeUpdate() == 0) None else LevelTableJdbcRead.findById(connection, levelId)
    } finally {
      statement.close()
    }
  }
}
