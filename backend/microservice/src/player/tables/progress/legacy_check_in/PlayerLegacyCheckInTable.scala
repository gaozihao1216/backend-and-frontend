package microservice.player.tables.progress.legacy_check_in

import java.sql.Connection
import java.time.Instant
import microservice.player.tables.progress.PlayerLegacyCheckInRow

/** 遗留签到状态表访问入口：只使用 JDBC 连接，事务由 APIMessage/DatabaseSession 统一管理。 */
private[player] object PlayerLegacyCheckInTable {

  def getStatus(connection: Connection, userId: String): String =
    PlayerLegacyCheckInTableSql.findByUserId(connection, userId).map(_.status).getOrElse("ready")

  def setStatus(connection: Connection, userId: String, status: String): String = {
    PlayerLegacyCheckInTableSql.upsert(
      connection,
      PlayerLegacyCheckInRow(
        userId = userId,
        status = status,
        updatedAt = Instant.now().toString
      )
    )
    status
  }
}

import java.sql.Connection
import microservice.player.tables.progress._

private[tables] object PlayerLegacyCheckInTableSql {

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

  def upsert(connection: Connection, row: PlayerLegacyCheckInRow): PlayerLegacyCheckInRow = {
    val statement = connection.prepareStatement(
      """
        INSERT INTO player_legacy_check_ins (user_id, status, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT (user_id) DO UPDATE SET
          status = EXCLUDED.status,
          updated_at = EXCLUDED.updated_at
      """
    )
    try {
      statement.setString(1, row.userId)
      statement.setString(2, row.status)
      statement.setString(3, row.updatedAt)
      statement.executeUpdate()
      row
    } finally {
      statement.close()
    }
  }
}
