/** InMemoryStore 上的 玩家钱包 CRUD；演示模式与单元测试使用。
  *
  * 关联：玩家模块 Table 门面在 connection == null 时委托到此实现。
  */
package microservice.player.tables.wallet.inmemory

import microservice.player.tables.wallet._

import microservice.infrastructure.database.InMemoryStore
import microservice.player.runtime.{PlayerRuntimeDefaults, PlayerWallet}

private[tables] object PlayerWalletTableInMemory {
  def findByUserId(userId: String): Option[PlayerWalletRow] =
    InMemoryStore.playerWallets.get(userId).map(toRow(userId, _))

  def upsert(row: PlayerWalletRow): PlayerWalletRow = {
    InMemoryStore.playerWallets = InMemoryStore.playerWallets.updated(
      row.userId,
      PlayerWallet(row.coins, row.gems, row.fragments)
    )
    row
  }

  private def toRow(userId: String, wallet: PlayerWallet): PlayerWalletRow =
    PlayerWalletRow(
      userId = userId,
      coins = wallet.coins,
      gems = wallet.gems,
      fragments = wallet.fragments,
      updatedAt = "in-memory"
    )

  def seedDefault(userId: String): Unit =
    if (!InMemoryStore.playerWallets.contains(userId)) {
      InMemoryStore.playerWallets = InMemoryStore.playerWallets.updated(userId, PlayerRuntimeDefaults.defaultWallet)
    }
}
