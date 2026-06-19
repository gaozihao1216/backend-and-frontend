/**
  *
   * 定义：PlayerWalletTableJdbcSchema：PostgreSQL DDL 与迁移/种子 SQL。
 * 问题：JDBC 模式冷启动需建表且与 in-memory 演示数据 id 对齐。
 * 作用：initialize(connection) 执行 CREATE TABLE / ALTER / INSERT ON CONFLICT。
 * 关联：[[PlayerWalletTableTable]] initialize 调用；docker init-store.sql 可对齐。
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
