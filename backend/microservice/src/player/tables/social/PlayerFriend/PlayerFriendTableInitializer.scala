package microservice.player.tables.social

import java.sql.Connection

object PlayerFriendTableInitializer {
  def initialize(connection: Connection): Unit = {
      val statement = connection.createStatement()
      try {
        statement.executeUpdate(
          """
            CREATE TABLE IF NOT EXISTS player_friends (
              user_id TEXT NOT NULL REFERENCES users(id),
              friend_user_id TEXT NOT NULL REFERENCES users(id),
              created_at TEXT NOT NULL,
              PRIMARY KEY (user_id, friend_user_id),
              CHECK (user_id <> friend_user_id)
            )
          """
        )
        statement.executeUpdate(
          """
            INSERT INTO player_friends (user_id, friend_user_id, created_at)
            VALUES ('player-1', 'designer-1', '2026-06-03T00:00:00Z')
            ON CONFLICT DO NOTHING
          """
        )
        statement.executeUpdate(
          """
            INSERT INTO player_friends (user_id, friend_user_id, created_at)
            VALUES ('designer-1', 'player-1', '2026-06-03T00:00:00Z')
            ON CONFLICT DO NOTHING
          """
        )
      } finally {
        statement.close()
      }
    }
}
