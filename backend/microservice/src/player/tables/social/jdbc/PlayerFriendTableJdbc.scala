package microservice.player.tables.social.jdbc

import java.sql.Connection

private[tables] object PlayerFriendTableJdbc {
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

def listFriendUserIds(connection: Connection, userId: String): Vector[String] = {
    val statement = connection.prepareStatement(
      "SELECT friend_user_id FROM player_friends WHERE user_id = ? ORDER BY created_at ASC"
    )
    try {
      statement.setString(1, userId)
      val resultSet = statement.executeQuery()
      try {
        val builder = Vector.newBuilder[String]
        while (resultSet.next()) {
          builder += resultSet.getString("friend_user_id")
        }
        builder.result()
      } finally {
        resultSet.close()
      }
    } finally {
      statement.close()
    }
  }

  def exists(connection: Connection, userId: String, friendUserId: String): Boolean = {
    val statement = connection.prepareStatement(
      "SELECT 1 FROM player_friends WHERE user_id = ? AND friend_user_id = ?"
    )
    try {
      statement.setString(1, userId)
      statement.setString(2, friendUserId)
      val resultSet = statement.executeQuery()
      try resultSet.next() finally resultSet.close()
    } finally {
      statement.close()
    }
  }

def insert(connection: Connection, userId: String, friendUserId: String, createdAt: String): Unit = {
    val statement = connection.prepareStatement(
      """
        INSERT INTO player_friends (user_id, friend_user_id, created_at)
        VALUES (?, ?, ?)
        ON CONFLICT DO NOTHING
      """
    )
    try {
      statement.setString(1, userId)
      statement.setString(2, friendUserId)
      statement.setString(3, createdAt)
      statement.executeUpdate()
    } finally {
      statement.close()
    }
  }
}
