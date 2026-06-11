package microservice.player.tables.wallet

import microservice.player.tables.wallet.inmemory._
import microservice.player.tables.wallet.jdbc._

import microservice.player.runtime.{PlayerRuntimeDefaults, PlayerWallet}
import java.sql.Connection
import java.time.Instant

/** 玩家钱包表访问门面：根据 connection 是否为 null 在 in-memory 与 JDBC 实现间分流。
  *
  * 存储 coins / gems / fragments 三种货币；新用户首次访问时写入 PlayerRuntimeDefaults 默认值。
  */
object PlayerWalletTable {
  private def isInMemory(connection: Connection): Boolean =
    connection == null

  /** 启动时建表；仅 JDBC 模式执行 DDL。 */
  def initialize(connection: Connection): Unit =
    if (!isInMemory(connection)) PlayerWalletTableJdbcSchema.initialize(connection)

  /** 读取用户钱包；不存在则按默认值创建并返回。 */
  def getOrCreate(connection: Connection, userId: String): PlayerWallet = {
    val now = Instant.now().toString
    if (isInMemory(connection)) {
      PlayerWalletTableInMemory.seedDefault(userId)
      PlayerWalletTableInMemory
        .findByUserId(userId)
        .map(toWallet)
        .getOrElse(PlayerRuntimeDefaults.defaultWallet)
    } else {
      PlayerWalletTableJdbcRead.findByUserId(connection, userId) match {
        case Some(row) => toWallet(row)
        case None =>
          val row = PlayerWalletTableJdbcWrite.upsert(
            connection,
            PlayerWalletRow(
              userId = userId,
              coins = PlayerRuntimeDefaults.defaultCoins,
              gems = PlayerRuntimeDefaults.defaultGems,
              fragments = PlayerRuntimeDefaults.defaultFragments,
              updatedAt = now
            )
          )
          toWallet(row)
      }
    }
  }

  /** 持久化钱包余额变更并返回保存后的钱包对象。 */
  def save(connection: Connection, userId: String, wallet: PlayerWallet): PlayerWallet = {
    val row = PlayerWalletRow(
      userId = userId,
      coins = wallet.coins,
      gems = wallet.gems,
      fragments = wallet.fragments,
      updatedAt = Instant.now().toString
    )
    val saved =
      if (isInMemory(connection)) PlayerWalletTableInMemory.upsert(row)
      else PlayerWalletTableJdbcWrite.upsert(connection, row)
    toWallet(saved)
  }

  private def toWallet(row: PlayerWalletRow): PlayerWallet =
    PlayerWallet(coins = row.coins, gems = row.gems, fragments = row.fragments)
}
