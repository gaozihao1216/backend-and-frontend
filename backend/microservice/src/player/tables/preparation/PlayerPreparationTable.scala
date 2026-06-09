package microservice.player.tables.preparation

import microservice.infrastructure.database.InMemoryStore
import microservice.player.preparation.BirdPreparationCatalog
import java.sql.Connection
import java.time.Instant

final case class PlayerBirdUpgradeRow(
  userId: String,
  birdType: String,
  level: Int,
  tier: Int,
  updatedAt: String
)

final case class PlayerSlingshotUpgradeRow(
  userId: String,
  level: Int,
  updatedAt: String
)

object PlayerPreparationTable {
  val maxLevel: Int = 5
  val maxTier: Int = BirdPreparationCatalog.maxTier

  private val systemBirdTypes: Vector[String] =
    BirdPreparationCatalog.entries.map(_.birdType)

  private def isInMemory(connection: Connection): Boolean = connection == null

  def initialize(connection: Connection): Unit =
    if (!isInMemory(connection)) {
      val statement = connection.createStatement()
      try {
        statement.executeUpdate(
          """
            CREATE TABLE IF NOT EXISTS player_bird_upgrades (
              user_id TEXT NOT NULL REFERENCES users(id),
              bird_type TEXT NOT NULL,
              level INTEGER NOT NULL DEFAULT 1,
              tier INTEGER NOT NULL DEFAULT 1,
              updated_at TEXT NOT NULL,
              PRIMARY KEY (user_id, bird_type)
            )
          """
        )
        statement.executeUpdate(
          "ALTER TABLE player_bird_upgrades ADD COLUMN IF NOT EXISTS tier INTEGER NOT NULL DEFAULT 1"
        )
        statement.executeUpdate(
          """
            CREATE TABLE IF NOT EXISTS player_slingshot_upgrades (
              user_id TEXT PRIMARY KEY REFERENCES users(id),
              level INTEGER NOT NULL DEFAULT 1,
              updated_at TEXT NOT NULL
            )
          """
        )
        systemBirdTypes.foreach { birdType =>
          statement.executeUpdate(
            s"""
              INSERT INTO player_bird_upgrades (user_id, bird_type, level, tier, updated_at)
              VALUES ('player-1', '$birdType', 1, 1, '2026-06-03T00:00:00Z')
              ON CONFLICT DO NOTHING
            """
          )
        }
        statement.executeUpdate(
          """
            INSERT INTO player_slingshot_upgrades (user_id, level, updated_at)
            VALUES ('player-1', 1, '2026-06-03T00:00:00Z')
            ON CONFLICT DO NOTHING
          """
        )
      } finally {
        statement.close()
      }
    } else {
      seedInMemory("player-1")
    }

  def seedInMemory(userId: String, birdTypes: Vector[String] = systemBirdTypes): Unit = {
    val now = Instant.now().toString
    birdTypes.foreach { birdType =>
      if (!InMemoryStore.playerBirdUpgrades.exists(row => row.userId == userId && row.birdType == birdType)) {
        InMemoryStore.playerBirdUpgrades =
          InMemoryStore.playerBirdUpgrades :+ PlayerBirdUpgradeRow(userId, birdType, 1, 1, now)
      }
    }
    if (!InMemoryStore.playerSlingshotUpgrades.exists(_.userId == userId)) {
      InMemoryStore.playerSlingshotUpgrades =
        InMemoryStore.playerSlingshotUpgrades :+ PlayerSlingshotUpgradeRow(userId, 1, now)
    }
  }

  def listBirdRows(connection: Connection, userId: String): Vector[PlayerBirdUpgradeRow] =
    if (isInMemory(connection)) {
      InMemoryStore.playerBirdUpgrades.filter(_.userId == userId)
    } else {
      val statement = connection.prepareStatement(
        "SELECT bird_type, level, tier, updated_at FROM player_bird_upgrades WHERE user_id = ?"
      )
      try {
        statement.setString(1, userId)
        val resultSet = statement.executeQuery()
        try {
          val builder = Vector.newBuilder[PlayerBirdUpgradeRow]
          while (resultSet.next()) {
            builder += PlayerBirdUpgradeRow(
              userId = userId,
              birdType = resultSet.getString("bird_type"),
              level = resultSet.getInt("level"),
              tier = resultSet.getInt("tier"),
              updatedAt = resultSet.getString("updated_at")
            )
          }
          builder.result()
        } finally {
          resultSet.close()
        }
      } finally {
        statement.close()
      }
    }

  def listBirdLevels(connection: Connection, userId: String): Map[String, Int] =
    listBirdRows(connection, userId).map(row => row.birdType -> row.level).toMap

  def listBirdTiers(connection: Connection, userId: String): Map[String, Int] =
    listBirdRows(connection, userId).map(row => row.birdType -> row.tier).toMap

  def getSlingshotLevel(connection: Connection, userId: String): Int = {
    ensureSlingshotDefault(connection, userId)
    if (isInMemory(connection)) {
      InMemoryStore.playerSlingshotUpgrades.find(_.userId == userId).map(_.level).getOrElse(1)
    } else {
      val statement = connection.prepareStatement(
        "SELECT level FROM player_slingshot_upgrades WHERE user_id = ?"
      )
      try {
        statement.setString(1, userId)
        val resultSet = statement.executeQuery()
        try if (resultSet.next()) resultSet.getInt("level") else 1
        finally resultSet.close()
      } finally {
        statement.close()
      }
    }
  }

  def upgradeBird(connection: Connection, userId: String, birdType: String): Either[String, Int] = {
    val current = listBirdLevels(connection, userId).getOrElse(birdType, 1)
    if (current >= maxLevel) {
      return Left("Bird is already at max level")
    }
    val nextLevel = current + 1
    val tier = listBirdTiers(connection, userId).getOrElse(birdType, 1)
    upsertBird(connection, userId, birdType, nextLevel, tier)
    Right(nextLevel)
  }

  def ascendBird(connection: Connection, userId: String, birdType: String): Either[String, Int] = {
    val currentTier = listBirdTiers(connection, userId).getOrElse(birdType, 1)
    if (currentTier >= maxTier) {
      return Left("Bird is already at max tier")
    }
    val nextTier = currentTier + 1
    val level = listBirdLevels(connection, userId).getOrElse(birdType, 1)
    upsertBird(connection, userId, birdType, level, nextTier)
    Right(nextTier)
  }

  def upgradeSlingshot(connection: Connection, userId: String): Either[String, Int] = {
    ensureSlingshotDefault(connection, userId)
    val current = getSlingshotLevel(connection, userId)
    if (current >= maxLevel) {
      return Left("Slingshot is already at max level")
    }
    val nextLevel = current + 1
    upsertSlingshot(connection, userId, nextLevel)
    Right(nextLevel)
  }

  def upgradeCost(level: Int): Int = level * 100

  def ascendCost(tier: Int): Int = tier * 8

  def ensureBirdDefaults(connection: Connection, userId: String, birdTypes: Vector[String]): Unit =
    if (isInMemory(connection)) seedInMemory(userId, birdTypes)
    else {
      birdTypes.foreach { birdType =>
        val statement = connection.prepareStatement(
          """
            INSERT INTO player_bird_upgrades (user_id, bird_type, level, tier, updated_at)
            VALUES (?, ?, 1, 1, ?)
            ON CONFLICT DO NOTHING
          """
        )
        try {
          statement.setString(1, userId)
          statement.setString(2, birdType)
          statement.setString(3, nowString())
          statement.executeUpdate()
        } finally {
          statement.close()
        }
      }
      ensureSlingshotDefault(connection, userId)
    }

  def ensureSlingshotDefault(connection: Connection, userId: String): Unit =
    if (isInMemory(connection)) {
      if (!InMemoryStore.playerSlingshotUpgrades.exists(_.userId == userId)) {
        InMemoryStore.playerSlingshotUpgrades =
          InMemoryStore.playerSlingshotUpgrades :+ PlayerSlingshotUpgradeRow(userId, 1, Instant.now().toString)
      }
    } else {
      val slingshotStatement = connection.prepareStatement(
        """
          INSERT INTO player_slingshot_upgrades (user_id, level, updated_at)
          VALUES (?, 1, ?)
          ON CONFLICT DO NOTHING
        """
      )
      try {
        slingshotStatement.setString(1, userId)
        slingshotStatement.setString(2, nowString())
        slingshotStatement.executeUpdate()
      } finally {
        slingshotStatement.close()
      }
    }

  private def ensureDefaults(connection: Connection, userId: String): Unit =
    ensureBirdDefaults(connection, userId, systemBirdTypes)

  private def upsertBird(
    connection: Connection,
    userId: String,
    birdType: String,
    level: Int,
    tier: Int
  ): Unit = {
    val updatedAt = nowString()
    if (isInMemory(connection)) {
      InMemoryStore.playerBirdUpgrades =
        InMemoryStore.playerBirdUpgrades.filterNot(row => row.userId == userId && row.birdType == birdType) :+
          PlayerBirdUpgradeRow(userId, birdType, level, tier, updatedAt)
    } else {
      val statement = connection.prepareStatement(
        """
          INSERT INTO player_bird_upgrades (user_id, bird_type, level, tier, updated_at)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT (user_id, bird_type) DO UPDATE SET
            level = EXCLUDED.level,
            tier = EXCLUDED.tier,
            updated_at = EXCLUDED.updated_at
        """
      )
      try {
        statement.setString(1, userId)
        statement.setString(2, birdType)
        statement.setInt(3, level)
        statement.setInt(4, tier)
        statement.setString(5, updatedAt)
        statement.executeUpdate()
      } finally {
        statement.close()
      }
    }
  }

  private def upsertSlingshot(connection: Connection, userId: String, level: Int): Unit = {
    val updatedAt = nowString()
    if (isInMemory(connection)) {
      InMemoryStore.playerSlingshotUpgrades =
        InMemoryStore.playerSlingshotUpgrades.filterNot(_.userId == userId) :+
          PlayerSlingshotUpgradeRow(userId, level, updatedAt)
    } else {
      val statement = connection.prepareStatement(
        """
          INSERT INTO player_slingshot_upgrades (user_id, level, updated_at)
          VALUES (?, ?, ?)
          ON CONFLICT (user_id) DO UPDATE SET
            level = EXCLUDED.level,
            updated_at = EXCLUDED.updated_at
        """
      )
      try {
        statement.setString(1, userId)
        statement.setInt(2, level)
        statement.setString(3, updatedAt)
        statement.executeUpdate()
      } finally {
        statement.close()
      }
    }
  }

  private def nowString(): String = Instant.now().toString
}
