/** 玩家钱包表的 JDBC 写操作（INSERT/UPDATE/DELETE）。
  *
  * 实现：PreparedStatement + Codec.bindRow；写成功后必要时 re-read 返回最新行。
  */
package microservice.player.tables.wallet.jdbc

import microservice.player.tables.wallet._

import java.sql.Connection

private[tables] object PlayerWalletTableJdbcWrite {
  def upsert(connection: Connection, row: PlayerWalletRow): PlayerWalletRow = {
    val statement = connection.prepareStatement(
      """
        INSERT INTO player_wallets (user_id, coins, gems, fragments, updated_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT (user_id) DO UPDATE SET
          coins = EXCLUDED.coins,
          gems = EXCLUDED.gems,
          fragments = EXCLUDED.fragments,
          updated_at = EXCLUDED.updated_at
      """
    )
    try {
      statement.setString(1, row.userId)
      statement.setInt(2, row.coins)
      statement.setInt(3, row.gems)
      statement.setInt(4, row.fragments)
      statement.setString(5, row.updatedAt)
      statement.executeUpdate()
      row
    } finally {
      statement.close()
    }
  }
}
