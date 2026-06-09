package microservice.player.tables.progress

import microservice.player.tables.progress.inmemory._
import microservice.player.tables.progress.jdbc._

import java.sql.Connection
import java.time.Instant

object PlayerLevelProgressTable {
  val defaultClearedSuffix: String = "level01"

  private def isInMemory(connection: Connection): Boolean =
    connection == null

  def initialize(connection: Connection): Unit =
    if (!isInMemory(connection)) PlayerLevelProgressTableJdbcSchema.initialize(connection)

  def listClearedSuffixes(connection: Connection, userId: String): Set[String] = {
    ensureDefaultProgress(connection, userId)
    val rows =
      if (isInMemory(connection)) PlayerLevelProgressTableInMemory.listByUserId(userId)
      else PlayerLevelProgressTableJdbcRead.listByUserId(connection, userId)
    rows.map(_.levelSuffix).toSet
  }

  def markCleared(connection: Connection, userId: String, levelSuffix: String): Set[String] = {
    val row = PlayerLevelProgressRow(
      userId = userId,
      levelSuffix = levelSuffix,
      clearedAt = Instant.now().toString
    )
    if (isInMemory(connection)) PlayerLevelProgressTableInMemory.insert(row)
    else PlayerLevelProgressTableJdbcWrite.insert(connection, row)
    listClearedSuffixes(connection, userId)
  }

  private def ensureDefaultProgress(connection: Connection, userId: String): Unit = {
    val rows =
      if (isInMemory(connection)) PlayerLevelProgressTableInMemory.listByUserId(userId)
      else PlayerLevelProgressTableJdbcRead.listByUserId(connection, userId)
    if (rows.nonEmpty) {
      return
    }

    val defaultRow = PlayerLevelProgressRow(
      userId = userId,
      levelSuffix = defaultClearedSuffix,
      clearedAt = Instant.now().toString
    )
    if (isInMemory(connection)) PlayerLevelProgressTableInMemory.insert(defaultRow)
    else PlayerLevelProgressTableJdbcWrite.insert(connection, defaultRow)
  }
}

object PlayerLegacyCheckInTable {
  private def isInMemory(connection: Connection): Boolean =
    connection == null

  def initialize(connection: Connection): Unit =
    if (!isInMemory(connection)) PlayerLegacyCheckInTableJdbcSchema.initialize(connection)

  def getStatus(connection: Connection, userId: String): String = {
    val row =
      if (isInMemory(connection)) PlayerLegacyCheckInTableInMemory.findByUserId(userId)
      else PlayerLegacyCheckInTableJdbcRead.findByUserId(connection, userId)
    row.map(_.status).getOrElse("ready")
  }

  def setStatus(connection: Connection, userId: String, status: String): String = {
    val row = PlayerLegacyCheckInRow(
      userId = userId,
      status = status,
      updatedAt = Instant.now().toString
    )
    if (isInMemory(connection)) PlayerLegacyCheckInTableInMemory.upsert(row)
    else PlayerLegacyCheckInTableJdbcWrite.upsert(connection, row)
    status
  }
}
