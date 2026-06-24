package microservice.player.tables.social

import java.sql.Connection

final case class PlayerPrivateMessageRow(
  id: String,
  senderId: String,
  receiverId: String,
  content: String,
  createdAt: String
)

private[tables] object PlayerPrivateMessageTableCodec {
  val baseSelect: String =
    "SELECT id, sender_id, receiver_id, content, created_at FROM player_private_messages"

  def rowFromResultSet(resultSet: java.sql.ResultSet): PlayerPrivateMessageRow =
    PlayerPrivateMessageRow(
      id = resultSet.getString("id"),
      senderId = resultSet.getString("sender_id"),
      receiverId = resultSet.getString("receiver_id"),
      content = resultSet.getString("content"),
      createdAt = resultSet.getString("created_at")
    )

  def bindRow(statement: java.sql.PreparedStatement, row: PlayerPrivateMessageRow): Unit = {
    statement.setString(1, row.id)
    statement.setString(2, row.senderId)
    statement.setString(3, row.receiverId)
    statement.setString(4, row.content)
    statement.setString(5, row.createdAt)
  }
}

object PlayerPrivateMessageTable {

def listConversation(connection: Connection, userId: String, withUserId: String): Vector[PlayerPrivateMessageRow] = {
    val statement = connection.prepareStatement(
      s"""
        ${PlayerPrivateMessageTableCodec.baseSelect}
        WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
        ORDER BY created_at ASC, id ASC
      """
    )
    try {
      statement.setString(1, userId)
      statement.setString(2, withUserId)
      statement.setString(3, withUserId)
      statement.setString(4, userId)
      val resultSet = statement.executeQuery()
      try {
        val builder = Vector.newBuilder[PlayerPrivateMessageRow]
        while (resultSet.next()) {
          builder += PlayerPrivateMessageTableCodec.rowFromResultSet(resultSet)
        }
        builder.result()
      } finally {
        resultSet.close()
      }
    } finally {
      statement.close()
    }
  }

  def nextId(connection: Connection): String = {
    val statement = connection.prepareStatement("SELECT COUNT(*) AS message_count FROM player_private_messages")
    try {
      val resultSet = statement.executeQuery()
      try if (resultSet.next()) f"pm-${resultSet.getInt("message_count") + 1}%04d" else "pm-0001"
      finally resultSet.close()
    } finally {
      statement.close()
    }
  }

def insert(connection: Connection, row: PlayerPrivateMessageRow): PlayerPrivateMessageRow = {
    val statement = connection.prepareStatement(
      """
        INSERT INTO player_private_messages (id, sender_id, receiver_id, content, created_at)
        VALUES (?, ?, ?, ?, ?)
      """
    )
    try {
      PlayerPrivateMessageTableCodec.bindRow(statement, row)
      statement.executeUpdate()
      row
    } finally {
      statement.close()
    }
  }
}
