package microservice.player.tables.social

import microservice.infrastructure.database.InMemoryStore
import java.sql.Connection
import java.time.Instant

/** 玩家好友关系表访问门面：单向存储 userId → friendUserId，加好友时双向 insertPair。 */
object PlayerFriendTable {
  private def isInMemory(connection: Connection): Boolean = connection == null

  /** 启动时建表/种子数据（含演示好友 player-1 ↔ designer-1）。 */
  def initialize(connection: Connection): Unit =
    if (!isInMemory(connection)) {
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
    } else if (InMemoryStore.playerFriends.isEmpty) {
      InMemoryStore.playerFriends = Vector(
        PlayerFriendRow("player-1", "designer-1", "2026-06-03T00:00:00Z"),
        PlayerFriendRow("designer-1", "player-1", "2026-06-03T00:00:00Z")
      )
    }

  /** 返回用户的全部好友 userId 列表（按 created_at 升序）。 */
  def listFriendUserIds(connection: Connection, userId: String): Vector[String] =
    if (isInMemory(connection)) {
      InMemoryStore.playerFriends.filter(_.userId == userId).map(_.friendUserId)
    } else {
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

  /** 判断两用户是否已为好友（单向存在即 true）。 */
  def exists(connection: Connection, userId: String, friendUserId: String): Boolean =
    if (isInMemory(connection)) {
      InMemoryStore.playerFriends.exists(row => row.userId == userId && row.friendUserId == friendUserId)
    } else {
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

  /** 双向插入好友关系（幂等，已存在则跳过）。 */
  def insertPair(connection: Connection, userId: String, friendUserId: String): Unit = {
    val createdAt = Instant.now().toString
    insertOne(connection, userId, friendUserId, createdAt)
    insertOne(connection, friendUserId, userId, createdAt)
  }

  private def insertOne(connection: Connection, userId: String, friendUserId: String, createdAt: String): Unit = {
    if (exists(connection, userId, friendUserId)) {
      return
    }
    if (isInMemory(connection)) {
      InMemoryStore.playerFriends = InMemoryStore.playerFriends :+ PlayerFriendRow(userId, friendUserId, createdAt)
    } else {
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
}

/** 玩家私信表访问门面：存储好友间的双向私信记录。 */
object PlayerPrivateMessageTable {
  private def isInMemory(connection: Connection): Boolean = connection == null

  /** 启动时建表与对话查询索引；仅 JDBC 模式执行 DDL。 */
  def initialize(connection: Connection): Unit =
    if (!isInMemory(connection)) {
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

  /** 列出两用户间的全部私信（双向，按时间升序）。 */
  def listConversation(connection: Connection, userId: String, withUserId: String): Vector[PlayerPrivateMessageRow] = {
    val rows =
      if (isInMemory(connection)) {
        InMemoryStore.playerPrivateMessages.filter { row =>
          (row.senderId == userId && row.receiverId == withUserId) ||
          (row.senderId == withUserId && row.receiverId == userId)
        }
      } else {
        val statement = connection.prepareStatement(
          """
            SELECT id, sender_id, receiver_id, content, created_at
            FROM player_private_messages
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
              builder += PlayerPrivateMessageRow(
                id = resultSet.getString("id"),
                senderId = resultSet.getString("sender_id"),
                receiverId = resultSet.getString("receiver_id"),
                content = resultSet.getString("content"),
                createdAt = resultSet.getString("created_at")
              )
            }
            builder.result()
          } finally {
            resultSet.close()
          }
        } finally {
          statement.close()
        }
      }
    rows.sortBy(row => (row.createdAt, row.id))
  }

  /** 插入一条私信并返回写入的行。 */
  def insert(connection: Connection, row: PlayerPrivateMessageRow): PlayerPrivateMessageRow =
    if (isInMemory(connection)) {
      InMemoryStore.playerPrivateMessages = InMemoryStore.playerPrivateMessages :+ row
      row
    } else {
      val statement = connection.prepareStatement(
        """
          INSERT INTO player_private_messages (id, sender_id, receiver_id, content, created_at)
          VALUES (?, ?, ?, ?, ?)
        """
      )
      try {
        statement.setString(1, row.id)
        statement.setString(2, row.senderId)
        statement.setString(3, row.receiverId)
        statement.setString(4, row.content)
        statement.setString(5, row.createdAt)
        statement.executeUpdate()
        row
      } finally {
        statement.close()
      }
    }

  /** 生成下一条私信 id（格式 pm-0001）。 */
  def nextId(connection: Connection): String = {
    val count =
      if (isInMemory(connection)) InMemoryStore.playerPrivateMessages.size
      else {
        val statement = connection.prepareStatement("SELECT COUNT(*) AS message_count FROM player_private_messages")
        try {
          val resultSet = statement.executeQuery()
          try if (resultSet.next()) resultSet.getInt("message_count") else 0
          finally resultSet.close()
        } finally {
          statement.close()
        }
      }
    f"pm-${count + 1}%04d"
  }
}
