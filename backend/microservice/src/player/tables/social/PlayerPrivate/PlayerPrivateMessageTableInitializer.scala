package microservice.player.tables.social

import java.sql.Connection

object PlayerPrivateMessageTableInitializer {
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
}
