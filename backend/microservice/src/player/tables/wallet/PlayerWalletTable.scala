package microservice.player.tables.wallet

import java.sql.Connection
import java.time.Instant
import microservice.infrastructure.database.{InMemoryStore, TableConnection}
import microservice.player.objects.PlayerWallet
import microservice.player.runtime.PlayerRuntimeDefaults
import microservice.player.tables.wallet.jdbc.PlayerWalletTableJdbc

/**
  *
   * 定义：PlayerWalletTable 表访问门面，connection==null 走 in-memory，否则 JDBC。
 * 问题：player 持久化需双后端一致 API，避免 APIMessage 分支存储逻辑。
 * 作用：initialize/list/find/insert/update 等统一入口。
 * 关联：[[DatabaseSession]]；inmemory 与 jdbc 子包实现。
 */
object PlayerWalletTable {
  /** 启动时建表；仅 JDBC 模式执行 DDL。 */
  def initialize(connection: Connection): Unit =
    if (!TableConnection.isInMemory(connection)) PlayerWalletTableJdbc.initialize(connection)

  /** 读取用户钱包；不存在则按默认值创建并返回。 */
  def getOrCreate(connection: Connection, userId: String): PlayerWallet = {
    val now = Instant.now().toString
    if (TableConnection.isInMemory(connection)) {
      if (!InMemoryStore.playerWallets.contains(userId)) {
        InMemoryStore.playerWallets = InMemoryStore.playerWallets.updated(userId, PlayerRuntimeDefaults.defaultWallet)
      }
      InMemoryStore.playerWallets.get(userId).getOrElse(PlayerRuntimeDefaults.defaultWallet)
    } else {
      PlayerWalletTableJdbc.findByUserId(connection, userId) match {
        case Some(row) => toWallet(row)
        case None =>
          val row = PlayerWalletTableJdbc.upsert(
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
      if (TableConnection.isInMemory(connection)) {
        InMemoryStore.playerWallets = InMemoryStore.playerWallets.updated(
          row.userId,
          PlayerWallet(row.coins, row.gems, row.fragments)
        )
        row
      } else {
        PlayerWalletTableJdbc.upsert(connection, row)
      }
    toWallet(saved)
  }

  private def toWallet(row: PlayerWalletRow): PlayerWallet =
    PlayerWallet(coins = row.coins, gems = row.gems, fragments = row.fragments)
}
