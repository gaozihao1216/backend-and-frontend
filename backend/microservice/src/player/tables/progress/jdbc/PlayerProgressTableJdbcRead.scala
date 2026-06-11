/** 玩家进度表的 JDBC 只读查询。
  *
  * 实现：PreparedStatement + Codec.rowFromResultSet；由 Table 门面在 connection != null 时委托。
  */
package microservice.player.tables.progress.jdbc

import microservice.player.tables.progress._

import java.sql.Connection

private[tables] object PlayerLevelProgressTableJdbcRead {
  def listByUserId(connection: Connection, userId: String): Vector[PlayerLevelProgressRow] = {
    val statement = connection.prepareStatement(
      s"${PlayerLevelProgressTableCodec.baseSelect} WHERE user_id = ? ORDER BY level_suffix ASC"
    )
    try {
      statement.setString(1, userId)
      val resultSet = statement.executeQuery()
      try {
        val builder = Vector.newBuilder[PlayerLevelProgressRow]
        while (resultSet.next()) {
          builder += PlayerLevelProgressTableCodec.rowFromResultSet(resultSet)
        }
        builder.result()
      } finally {
        resultSet.close()
      }
    } finally {
      statement.close()
    }
  }
}

private[tables] object PlayerLegacyCheckInTableJdbcRead {
  def findByUserId(connection: Connection, userId: String): Option[PlayerLegacyCheckInRow] = {
    val statement = connection.prepareStatement(
      s"${PlayerLegacyCheckInTableCodec.baseSelect} WHERE user_id = ?"
    )
    try {
      statement.setString(1, userId)
      val resultSet = statement.executeQuery()
      try {
        if (resultSet.next()) Some(PlayerLegacyCheckInTableCodec.rowFromResultSet(resultSet)) else None
      } finally {
        resultSet.close()
      }
    } finally {
      statement.close()
    }
  }
}
