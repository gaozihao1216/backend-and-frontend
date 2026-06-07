package microservice.player.tables

import java.sql.Connection

private[tables] object PlayerWalletTableJdbc {
  def initialize(connection: Connection): Unit =
    PlayerWalletTableJdbcSchema.initialize(connection)

  def findByUserId(connection: Connection, userId: String): Option[PlayerWalletRow] =
    PlayerWalletTableJdbcRead.findByUserId(connection, userId)

  def upsert(connection: Connection, row: PlayerWalletRow): PlayerWalletRow =
    PlayerWalletTableJdbcWrite.upsert(connection, row)
}
