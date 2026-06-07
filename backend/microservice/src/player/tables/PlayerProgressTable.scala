package microservice.player.tables

import java.sql.Connection
import java.time.Instant

object PlayerLevelProgressTable {
  val defaultClearedSuffix: String = "level01"

  private def isInMemory(connection: Connection): Boolean =
    connection == null

  def initialize(connection: Connection): Unit =
    if (!isInMemory(connection)) PlayerLevelProgressTableJdbc.initialize(connection)

  def listClearedSuffixes(connection: Connection, userId: String): Set[String] = {
    ensureDefaultProgress(connection, userId)
    val rows =
      if (isInMemory(connection)) PlayerLevelProgressTableInMemory.listByUserId(userId)
      else PlayerLevelProgressTableJdbc.listByUserId(connection, userId)
    rows.map(_.levelSuffix).toSet
  }

  def markCleared(connection: Connection, userId: String, levelSuffix: String): Set[String] = {
    val row = PlayerLevelProgressRow(
      userId = userId,
      levelSuffix = levelSuffix,
      clearedAt = Instant.now().toString
    )
    if (isInMemory(connection)) PlayerLevelProgressTableInMemory.insert(row)
    else PlayerLevelProgressTableJdbc.insert(connection, row)
    listClearedSuffixes(connection, userId)
  }

  private def ensureDefaultProgress(connection: Connection, userId: String): Unit = {
    val rows =
      if (isInMemory(connection)) PlayerLevelProgressTableInMemory.listByUserId(userId)
      else PlayerLevelProgressTableJdbc.listByUserId(connection, userId)
    if (rows.nonEmpty) {
      return
    }

    val defaultRow = PlayerLevelProgressRow(
      userId = userId,
      levelSuffix = defaultClearedSuffix,
      clearedAt = Instant.now().toString
    )
    if (isInMemory(connection)) PlayerLevelProgressTableInMemory.insert(defaultRow)
    else PlayerLevelProgressTableJdbc.insert(connection, defaultRow)
  }
}

object PlayerLegacyCheckInTable {
  private def isInMemory(connection: Connection): Boolean =
    connection == null

  def initialize(connection: Connection): Unit =
    if (!isInMemory(connection)) PlayerLegacyCheckInTableJdbc.initialize(connection)

  def getStatus(connection: Connection, userId: String): String = {
    val row =
      if (isInMemory(connection)) PlayerLegacyCheckInTableInMemory.findByUserId(userId)
      else PlayerLegacyCheckInTableJdbc.findByUserId(connection, userId)
    row.map(_.status).getOrElse("ready")
  }

  def setStatus(connection: Connection, userId: String, status: String): String = {
    val row = PlayerLegacyCheckInRow(
      userId = userId,
      status = status,
      updatedAt = Instant.now().toString
    )
    if (isInMemory(connection)) PlayerLegacyCheckInTableInMemory.upsert(row)
    else PlayerLegacyCheckInTableJdbc.upsert(connection, row)
    status
  }
}
