package microservice.player.tables.social

import java.sql.Connection
import java.time.Instant

/** 玩家好友表访问入口：只使用 JDBC 连接，事务由 APIMessage/DatabaseSession 统一管理。 */
private[player] object PlayerFriendTable {

  def listFriendUserIds(connection: Connection, userId: String): Vector[String] =
    PlayerFriendTableSql.listFriendUserIds(connection, userId)

  def exists(connection: Connection, userId: String, friendUserId: String): Boolean =
    PlayerFriendTableSql.exists(connection, userId, friendUserId)

  def insertPair(connection: Connection, userId: String, friendUserId: String): Unit = {
    val createdAt = Instant.now().toString
    insertOne(connection, userId, friendUserId, createdAt)
    insertOne(connection, friendUserId, userId, createdAt)
  }

  private def insertOne(connection: Connection, userId: String, friendUserId: String, createdAt: String): Unit =
    if (!exists(connection, userId, friendUserId)) {
      PlayerFriendTableSql.insert(connection, userId, friendUserId, createdAt)
    }
}

import java.sql.Connection

private[tables] object PlayerFriendTableSql {

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
