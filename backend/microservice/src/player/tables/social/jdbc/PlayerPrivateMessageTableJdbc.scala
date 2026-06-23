package microservice.player.tables.social.jdbc

import java.sql.Connection
import microservice.player.tables.social.{PlayerPrivateMessageRow, PlayerPrivateMessageTableCodec}

private[tables] object PlayerPrivateMessageTableJdbc {
def initialize(connection: Connection): Unit = {
    val statement = connection.createStatement()
    try {
      statement.executeUpdate(
        """
          CREATE TABLE IF NOT EXISTS player_private_messages (
            id TEXT PRIMARY KEY,
            sender_id TEXT NOT NULL REFERENCES users(id),
            receiver_id TEXT NOT NULL REFERENCES users(id),
            content TEXT NOT NULL,
            created_at TEXT NOT NULL
          )
        """
      )
      statement.executeUpdate(
        "CREATE INDEX IF NOT EXISTS player_private_messages_pair_idx ON player_private_messages (sender_id, receiver_id, created_at)"
      )
    } finally {
      statement.close()
    }
  }

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
