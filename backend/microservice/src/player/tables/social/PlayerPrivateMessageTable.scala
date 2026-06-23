package microservice.player.tables.social

import java.sql.Connection
import microservice.infrastructure.database.{InMemoryStore, TableConnection}
import microservice.player.tables.social.jdbc.PlayerPrivateMessageTableJdbc

/** 玩家私信表访问门面：存储好友间的双向私信记录。 */
object PlayerPrivateMessageTable {
  /** 启动时建表与对话查询索引；仅 JDBC 模式执行 DDL。 */
  def initialize(connection: Connection): Unit =
    if (!TableConnection.isInMemory(connection)) PlayerPrivateMessageTableJdbc.initialize(connection)

  /** 列出两用户间的全部私信（双向，按时间升序）。 */
  def listConversation(connection: Connection, userId: String, withUserId: String): Vector[PlayerPrivateMessageRow] = {
    val rows =
      if (TableConnection.isInMemory(connection)) {
        InMemoryStore.playerPrivateMessages.filter { row =>
          (row.senderId == userId && row.receiverId == withUserId) ||
          (row.senderId == withUserId && row.receiverId == userId)
        }
      } else {
        PlayerPrivateMessageTableJdbc.listConversation(connection, userId, withUserId)
      }
    rows.sortBy(row => (row.createdAt, row.id))
  }

  /** 插入一条私信并返回写入的行。 */
  def insert(connection: Connection, row: PlayerPrivateMessageRow): PlayerPrivateMessageRow =
    if (TableConnection.isInMemory(connection)) {
      InMemoryStore.playerPrivateMessages = InMemoryStore.playerPrivateMessages :+ row
      row
    } else {
      PlayerPrivateMessageTableJdbc.insert(connection, row)
    }

  /** 生成下一条私信 id（格式 pm-0001）。 */
  def nextId(connection: Connection): String =
    if (TableConnection.isInMemory(connection)) {
      f"pm-${InMemoryStore.playerPrivateMessages.size + 1}%04d"
    } else {
      PlayerPrivateMessageTableJdbc.nextId(connection)
    }
}
