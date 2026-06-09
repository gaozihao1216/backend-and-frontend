package microservice.player.tables.weekly_check_in.jdbc

import microservice.player.tables.weekly_check_in._

import java.sql.Connection

private[tables] object PlayerWeeklyCheckInTableJdbcRead {
  def findByUserAndWeek(connection: Connection, userId: String, weekKey: String): Option[PlayerWeeklyCheckInRow] = {
    val statement =
      connection.prepareStatement(s"${PlayerWeeklyCheckInTableCodec.baseSelect} WHERE user_id = ? AND week_key = ?")
    try {
      statement.setString(1, userId)
      statement.setString(2, weekKey)
      val resultSet = statement.executeQuery()
      try {
        if (resultSet.next()) Some(PlayerWeeklyCheckInTableCodec.rowFromResultSet(resultSet)) else None
      } finally {
        resultSet.close()
      }
    } finally {
      statement.close()
    }
  }
}
