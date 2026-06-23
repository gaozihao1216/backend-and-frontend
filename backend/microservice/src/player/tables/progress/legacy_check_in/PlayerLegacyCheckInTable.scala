package microservice.player.tables.progress.legacy_check_in

import java.sql.Connection
import java.time.Instant
import microservice.infrastructure.database.{InMemoryStore, TableConnection}
import microservice.player.tables.progress.PlayerLegacyCheckInRow
import microservice.player.tables.progress.jdbc.PlayerLegacyCheckInTableJdbc

/** 遗留签到状态表访问门面：兼容旧版 player.checkIn apiKey 的简单 ready/claimed 状态机。 */
object PlayerLegacyCheckInTable {
  /** 启动时建表；仅 JDBC 模式执行 DDL。 */
  def initialize(connection: Connection): Unit =
    if (!TableConnection.isInMemory(connection)) PlayerLegacyCheckInTableJdbc.initialize(connection)

  /** 读取用户遗留签到状态，无记录时默认 "ready"。 */
  def getStatus(connection: Connection, userId: String): String = {
    val row =
      if (TableConnection.isInMemory(connection)) {
        InMemoryStore.playerLegacyCheckIns.find(_.userId == userId)
      } else {
        PlayerLegacyCheckInTableJdbc.findByUserId(connection, userId)
      }
    row.map(_.status).getOrElse("ready")
  }

  /** 更新遗留签到状态并返回新状态字符串。 */
  def setStatus(connection: Connection, userId: String, status: String): String = {
    val row = PlayerLegacyCheckInRow(
      userId = userId,
      status = status,
      updatedAt = Instant.now().toString
    )
    if (TableConnection.isInMemory(connection)) {
      InMemoryStore.playerLegacyCheckIns =
        InMemoryStore.playerLegacyCheckIns.filterNot(_.userId == row.userId) :+ row
    } else {
      PlayerLegacyCheckInTableJdbc.upsert(connection, row)
    }
    status
  }
}
