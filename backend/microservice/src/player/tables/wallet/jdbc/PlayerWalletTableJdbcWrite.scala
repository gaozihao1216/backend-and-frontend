/**
  *
   * 定义：PlayerWalletTableJdbcWrite：PlayerWalletTable 表的 JDBC 写实现。
 * 问题：insert/update 需参数化 SQL 防注入且与 Row 字段一一对应。
 * 作用：INSERT/UPDATE/DELETE；写后必要时 re-read 返回最新 Row。
 * 关联：[[PlayerWalletTable]] 写路径分流；事务由 APIMessage.run 外层提交。
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
