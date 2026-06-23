package microservice.player.tables.social

import java.sql.Connection
import java.time.Instant
import microservice.infrastructure.database.{InMemoryStore, TableConnection}
import microservice.player.tables.social.jdbc.PlayerFriendTableJdbc

/**
  *
   * 定义：PlayerFriendTable 表访问门面，connection==null 走 in-memory，否则 JDBC。
 * 问题：player 持久化需双后端一致 API，避免 APIMessage 分支存储逻辑。
 * 作用：initialize/list/find/insert/update 等统一入口。
 * 关联：[[DatabaseSession]]；inmemory 与 jdbc 子包实现。
 */
object PlayerFriendTable {
  /** 启动时建表/种子数据（含演示好友 player-1 ↔ designer-1）。 */
  def initialize(connection: Connection): Unit =
    if (!TableConnection.isInMemory(connection)) PlayerFriendTableJdbc.initialize(connection)
    else seedDefaultsInMemory()

  /** 返回用户的全部好友 userId 列表（按 created_at 升序）。 */
  def listFriendUserIds(connection: Connection, userId: String): Vector[String] =
    if (TableConnection.isInMemory(connection)) {
      InMemoryStore.playerFriends.filter(_.userId == userId).map(_.friendUserId)
    } else {
      PlayerFriendTableJdbc.listFriendUserIds(connection, userId)
    }

  /** 判断两用户是否已为好友（单向存在即 true）。 */
  def exists(connection: Connection, userId: String, friendUserId: String): Boolean =
    if (TableConnection.isInMemory(connection)) {
      InMemoryStore.playerFriends.exists(row => row.userId == userId && row.friendUserId == friendUserId)
    } else {
      PlayerFriendTableJdbc.exists(connection, userId, friendUserId)
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
    if (TableConnection.isInMemory(connection)) {
      InMemoryStore.playerFriends = InMemoryStore.playerFriends :+ PlayerFriendRow(userId, friendUserId, createdAt)
    } else {
      PlayerFriendTableJdbc.insert(connection, userId, friendUserId, createdAt)
    }
  }

  private def seedDefaultsInMemory(): Unit =
    if (InMemoryStore.playerFriends.isEmpty) {
      InMemoryStore.playerFriends = Vector(
        PlayerFriendRow("player-1", "designer-1", "2026-06-03T00:00:00Z"),
        PlayerFriendRow("designer-1", "player-1", "2026-06-03T00:00:00Z")
      )
    }
}
