package microservice.player.tables.wallet.jdbc

import java.sql.Connection
import microservice.player.tables.wallet._

private[tables] object PlayerWalletTableJdbc {
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

def findByUserId(connection: Connection, userId: String): Option[PlayerWalletRow] = {
    val statement = connection.prepareStatement(s"${PlayerWalletTableCodec.baseSelect} WHERE user_id = ?")
    try {
      statement.setString(1, userId)
      val resultSet = statement.executeQuery()
      try {
        if (resultSet.next()) Some(PlayerWalletTableCodec.rowFromResultSet(resultSet)) else None
      } finally {
        resultSet.close()
      }
    } finally {
      statement.close()
    }
  }

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
