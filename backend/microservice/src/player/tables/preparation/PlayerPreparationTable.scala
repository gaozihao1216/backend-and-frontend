package microservice.player.tables.preparation

import java.sql.Connection
import java.time.Instant

/**
  *
   * 定义：PlayerPreparationRows case class，与 DB 表列一一对应的存储层行模型。
 * 问题：API 对象不宜直接暴露 SQL 列布局，需 Row 作为持久化边界。
 * 作用：Table insert/find 的入参/出参；经 Mapper/Codec 与 objects 层转换。
 * 关联：同包 [[PlayerPreparationTables]] 读写。
 */
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

private[tables] object PlayerPreparationTableCodec {
  def birdRowFromResultSet(userId: String, resultSet: java.sql.ResultSet): PlayerBirdUpgradeRow =
    PlayerBirdUpgradeRow(
      userId = userId,
      birdType = resultSet.getString("bird_type"),
      level = resultSet.getInt("level"),
      tier = resultSet.getInt("tier"),
      updatedAt = resultSet.getString("updated_at")
    )
}

/** 玩家备战表访问入口：只使用 JDBC 连接，事务由 APIMessage/DatabaseSession 统一管理。 */
private[player] object PlayerPreparationTable {
  val maxLevel: Int = 5
  val maxTier: Int = 3

  def listBirdRows(connection: Connection, userId: String): Vector[PlayerBirdUpgradeRow] =
    PlayerPreparationTableSql.listBirdRows(connection, userId)

  def listBirdLevels(connection: Connection, userId: String): Map[String, Int] =
    listBirdRows(connection, userId).map(row => row.birdType -> row.level).toMap

  def listBirdTiers(connection: Connection, userId: String): Map[String, Int] =
    listBirdRows(connection, userId).map(row => row.birdType -> row.tier).toMap

  def getSlingshotLevel(connection: Connection, userId: String): Int = {
    ensureSlingshotDefault(connection, userId)
    PlayerPreparationTableSql.getSlingshotLevel(connection, userId)
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

  def ensureBirdDefaults(connection: Connection, userId: String, birdTypes: Vector[String]): Unit = {
    birdTypes.foreach { birdType =>
      PlayerPreparationTableSql.insertBirdDefault(connection, userId, birdType, nowString())
    }
    ensureSlingshotDefault(connection, userId)
  }

  def ensureSlingshotDefault(connection: Connection, userId: String): Unit =
    PlayerPreparationTableSql.ensureSlingshotDefault(connection, userId, nowString())

  private def upsertBird(
    connection: Connection,
    userId: String,
    birdType: String,
    level: Int,
    tier: Int
  ): Unit =
    PlayerPreparationTableSql.upsertBird(connection, userId, birdType, level, tier, nowString())

  private def upsertSlingshot(connection: Connection, userId: String, level: Int): Unit =
    PlayerPreparationTableSql.upsertSlingshot(connection, userId, level, nowString())

  private def nowString(): String = Instant.now().toString
}


private[tables] object PlayerPreparationTableSql {

def listBirdRows(connection: Connection, userId: String): Vector[PlayerBirdUpgradeRow] = {
    val statement = connection.prepareStatement(
      "SELECT bird_type, level, tier, updated_at FROM player_bird_upgrades WHERE user_id = ?"
    )
    try {
      statement.setString(1, userId)
      val resultSet = statement.executeQuery()
      try {
        val builder = Vector.newBuilder[PlayerBirdUpgradeRow]
        while (resultSet.next()) {
          builder += PlayerPreparationTableCodec.birdRowFromResultSet(userId, resultSet)
        }
        builder.result()
      } finally {
        resultSet.close()
      }
    } finally {
      statement.close()
    }
  }

  def getSlingshotLevel(connection: Connection, userId: String): Int = {
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

def insertBirdDefault(connection: Connection, userId: String, birdType: String, updatedAt: String): Unit = {
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
      statement.setString(3, updatedAt)
      statement.executeUpdate()
    } finally {
      statement.close()
    }
  }

  def ensureSlingshotDefault(connection: Connection, userId: String, updatedAt: String): Unit = {
    val statement = connection.prepareStatement(
      """
        INSERT INTO player_slingshot_upgrades (user_id, level, updated_at)
        VALUES (?, 1, ?)
        ON CONFLICT DO NOTHING
      """
    )
    try {
      statement.setString(1, userId)
      statement.setString(2, updatedAt)
      statement.executeUpdate()
    } finally {
      statement.close()
    }
  }

  def upsertBird(
    connection: Connection,
    userId: String,
    birdType: String,
    level: Int,
    tier: Int,
    updatedAt: String
  ): Unit = {
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

  def upsertSlingshot(connection: Connection, userId: String, level: Int, updatedAt: String): Unit = {
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
