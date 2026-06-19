/**
  *
   * 定义：PlayerWalletTableInMemory：InMemoryStore 上的 PlayerWalletTable CRUD。
 * 问题：UGC_DATABASE_MODE 非 jdbc 时 connection=null，需内存向量/Map 模拟表。
 * 作用：与 JDBC 实现同签名，供 Table 门面透明切换。
 * 关联：[[InMemoryStore]]；[[PlayerWalletTable]] isInMemory 分支。
 */
package microservice.player.tables.wallet.inmemory

import microservice.player.tables.wallet._

import microservice.infrastructure.database.InMemoryStore
import microservice.player.objects.{PlayerWallet}
import microservice.player.runtime.PlayerRuntimeDefaults

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
