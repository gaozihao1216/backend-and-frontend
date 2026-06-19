/**
  *
   * 定义：PlayerWalletTableJdbcRead：PlayerWalletTable 表的 JDBC 只读实现。
 * 问题：门面 Table 在 connection!=null 时需 PreparedStatement 查询 PostgreSQL。
 * 作用：list/find/count 等 SELECT，ResultSet 经 Codec 转 Row。
 * 关联：[[PlayerWalletTable]] 读路径分流；[[PlayerWalletTableCodec]] rowFromResultSet。
 */
package microservice.player.tables.wallet.jdbc

import microservice.player.tables.wallet._

import java.sql.Connection

private[tables] object PlayerWalletTableJdbcRead {
  def findByUserId(connection: Connection, userId: String): Option[PlayerWalletRow] = {
    val statement = connection.prepareStatement(s"${PlayerWalletTableCodec.baseSelect} WHERE user_id = ?")
    try {
      statement.setString(1, userId)
      val resultSet = statement.executeQuery()
      try {
        if (resultSet.next()) Some(PlayerWalletTableCodec.rowFromResultSet(resultSet)) else None
      } finally {
        resultSet.close()
      }
    } finally {
      statement.close()
    }
  }
}
