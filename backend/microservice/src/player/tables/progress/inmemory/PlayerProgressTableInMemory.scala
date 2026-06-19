/**
  *
   * 定义：PlayerProgressTableInMemory：InMemoryStore 上的 PlayerProgressTable CRUD。
 * 问题：UGC_DATABASE_MODE 非 jdbc 时 connection=null，需内存向量/Map 模拟表。
 * 作用：与 JDBC 实现同签名，供 Table 门面透明切换。
 * 关联：[[InMemoryStore]]；[[PlayerProgressTable]] isInMemory 分支。
 */
package microservice.player.tables.progress.inmemory

import microservice.player.tables.progress._

import microservice.infrastructure.database.InMemoryStore

private[tables] object PlayerLevelProgressTableInMemory {
  def listByUserId(userId: String): Vector[PlayerLevelProgressRow] =
    InMemoryStore.playerLevelProgress.filter(_.userId == userId).sortBy(_.levelSuffix)

  def insert(row: PlayerLevelProgressRow): PlayerLevelProgressRow = {
    if (!InMemoryStore.playerLevelProgress.exists(entry => entry.userId == row.userId && entry.levelSuffix == row.levelSuffix)) {
      InMemoryStore.playerLevelProgress = InMemoryStore.playerLevelProgress :+ row
    }
    row
  }

  def seedDefault(userId: String, clearedAt: String): Unit = {
    if (!InMemoryStore.playerLevelProgress.exists(_.userId == userId)) {
      InMemoryStore.playerLevelProgress = InMemoryStore.playerLevelProgress :+ PlayerLevelProgressRow(
        userId = userId,
        levelSuffix = "level01",
        clearedAt = clearedAt
      )
    }
  }
}

private[tables] object PlayerLegacyCheckInTableInMemory {
  def findByUserId(userId: String): Option[PlayerLegacyCheckInRow] =
    InMemoryStore.playerLegacyCheckIns.find(_.userId == userId)

  def upsert(row: PlayerLegacyCheckInRow): PlayerLegacyCheckInRow = {
    InMemoryStore.playerLegacyCheckIns =
      InMemoryStore.playerLegacyCheckIns.filterNot(_.userId == row.userId) :+ row
    row
  }
}
