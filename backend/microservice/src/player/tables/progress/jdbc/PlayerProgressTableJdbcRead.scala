/**
  *
   * 定义：PlayerProgressTableJdbcRead：PlayerProgressTable 表的 JDBC 只读实现。
 * 问题：门面 Table 在 connection!=null 时需 PreparedStatement 查询 PostgreSQL。
 * 作用：list/find/count 等 SELECT，ResultSet 经 Codec 转 Row。
 * 关联：[[PlayerProgressTable]] 读路径分流；[[PlayerProgressTableCodec]] rowFromResultSet。
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
