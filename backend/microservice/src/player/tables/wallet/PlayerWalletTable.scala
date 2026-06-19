package microservice.player.tables.wallet

import microservice.player.tables.wallet.inmemory._
import microservice.player.tables.wallet.jdbc._

import microservice.player.objects.{PlayerWallet}
import microservice.player.runtime.PlayerRuntimeDefaults
import java.sql.Connection
import java.time.Instant

/**
  *
   * 定义：PlayerWalletTable 表访问门面，connection==null 走 in-memory，否则 JDBC。
 * 问题：player 持久化需双后端一致 API，避免 APIMessage 分支存储逻辑。
 * 作用：initialize/list/find/insert/update 等统一入口。
 * 关联：[[DatabaseSession]]；inmemory 与 jdbc 子包实现。
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
