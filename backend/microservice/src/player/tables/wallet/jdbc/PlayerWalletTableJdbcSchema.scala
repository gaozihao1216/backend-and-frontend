/** 玩家钱包表的 PostgreSQL DDL 与索引（JDBC 模式首次 initialize 时执行）。
  *
  * 关联：玩家模块 Table 门面在 JDBC 模式下 startup 时调用。
  */
package microservice.player.tables.wallet.jdbc

import microservice.player.tables.wallet._

import java.sql.Connection

private[tables] object PlayerWalletTableJdbcSchema {
  def initialize(connection: Connection): Unit = {
    val statement = connection.createStatement()
    try {
      statement.executeUpdate(
        """
          CREATE TABLE IF NOT EXISTS player_wallets (
            user_id TEXT PRIMARY KEY REFERENCES users(id),
            coins INTEGER NOT NULL DEFAULT 0,
            gems INTEGER NOT NULL DEFAULT 0,
            fragments INTEGER NOT NULL DEFAULT 0,
            updated_at TEXT NOT NULL
          )
        """
      )
      statement.executeUpdate(
        """
          INSERT INTO player_wallets (user_id, coins, gems, fragments, updated_at)
          VALUES ('player-1', 1280, 96, 0, '2026-06-03T00:00:00Z')
          ON CONFLICT (user_id) DO NOTHING
        """
      )
    } finally {
      statement.close()
    }
  }
}
