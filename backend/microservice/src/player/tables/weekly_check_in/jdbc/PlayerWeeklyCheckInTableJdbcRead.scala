/**
  *
   * 定义：PlayerWeeklyCheckInTableJdbcRead：PlayerWeeklyCheckInTable 表的 JDBC 只读实现。
 * 问题：门面 Table 在 connection!=null 时需 PreparedStatement 查询 PostgreSQL。
 * 作用：list/find/count 等 SELECT，ResultSet 经 Codec 转 Row。
 * 关联：[[PlayerWeeklyCheckInTable]] 读路径分流；[[PlayerWeeklyCheckInTableCodec]] rowFromResultSet。
 */
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
