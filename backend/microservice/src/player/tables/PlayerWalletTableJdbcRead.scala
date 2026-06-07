package microservice.player.tables

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
