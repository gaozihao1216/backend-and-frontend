package microservice.player.tables.preparation

import java.sql.Connection
import java.time.Instant
import microservice.infrastructure.database.{InMemoryStore, TableConnection}
import microservice.player.preparation.BirdPreparationCatalog
import microservice.player.tables.preparation.jdbc.PlayerPreparationTableJdbc

/**
  *
   * 定义：PlayerPreparationTable 表访问门面，connection==null 走 in-memory，否则 JDBC。
 * 问题：player 持久化需双后端一致 API，避免 APIMessage 分支存储逻辑。
 * 作用：initialize/list/find/insert/update 等统一入口。
 * 关联：[[DatabaseSession]]；inmemory 与 jdbc 子包实现。
 */
object PlayerPreparationTable {
  /** 鸟与弹弓等级上限。 */
  val maxLevel: Int = 5
  /** 鸟阶位上限（与 BirdPreparationCatalog.maxTier 一致）。 */
  val maxTier: Int = BirdPreparationCatalog.maxTier

  private val systemBirdTypes: Vector[String] =
    BirdPreparationCatalog.entries.map(_.birdType)

  /** 启动时建表/种子数据（含演示用户 player-1 的默认鸟与弹弓）。 */
  def initialize(connection: Connection): Unit =
    if (!TableConnection.isInMemory(connection)) PlayerPreparationTableJdbc.initialize(connection, systemBirdTypes)
    else seedInMemory("player-1")

  /** 为 in-memory 用户写入默认鸟与弹弓等级（幂等）。 */
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

  /** 返回用户全部鸟升级行。 */
  def listBirdRows(connection: Connection, userId: String): Vector[PlayerBirdUpgradeRow] =
    if (TableConnection.isInMemory(connection)) {
      InMemoryStore.playerBirdUpgrades.filter(_.userId == userId)
    } else {
      PlayerPreparationTableJdbc.listBirdRows(connection, userId)
    }

  /** 返回 birdType → level 映射。 */
  def listBirdLevels(connection: Connection, userId: String): Map[String, Int] =
    listBirdRows(connection, userId).map(row => row.birdType -> row.level).toMap

  /** 返回 birdType → tier 映射。 */
  def listBirdTiers(connection: Connection, userId: String): Map[String, Int] =
    listBirdRows(connection, userId).map(row => row.birdType -> row.tier).toMap

  /** 读取弹弓等级（不存在时 ensure 默认 1 级）。 */
  def getSlingshotLevel(connection: Connection, userId: String): Int = {
    ensureSlingshotDefault(connection, userId)
    if (TableConnection.isInMemory(connection)) {
      InMemoryStore.playerSlingshotUpgrades.find(_.userId == userId).map(_.level).getOrElse(1)
    } else {
      PlayerPreparationTableJdbc.getSlingshotLevel(connection, userId)
    }
  }

  /** 将指定鸟等级 +1；已达 maxLevel 时返回 Left 错误信息。 */
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

  /** 将指定鸟阶位 +1；已达 maxTier 时返回 Left 错误信息。 */
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

  /** 将弹弓等级 +1；已达 maxLevel 时返回 Left 错误信息。 */
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

  /** 计算从当前等级升级到下一级所需金币（level * 100）。 */
  def upgradeCost(level: Int): Int = level * 100

  /** 计算从当前阶位升阶到下一阶所需碎片（tier * 8）。 */
  def ascendCost(tier: Int): Int = tier * 8

  /** 确保用户对给定 birdTypes 均有默认 1 级 1 阶记录（幂等）。 */
  def ensureBirdDefaults(connection: Connection, userId: String, birdTypes: Vector[String]): Unit =
    if (TableConnection.isInMemory(connection)) seedInMemory(userId, birdTypes)
    else {
      birdTypes.foreach { birdType =>
        PlayerPreparationTableJdbc.insertBirdDefault(connection, userId, birdType, nowString())
      }
      ensureSlingshotDefault(connection, userId)
    }

  /** 确保用户有默认 1 级弹弓记录（幂等）。 */
  def ensureSlingshotDefault(connection: Connection, userId: String): Unit =
    if (TableConnection.isInMemory(connection)) {
      if (!InMemoryStore.playerSlingshotUpgrades.exists(_.userId == userId)) {
        InMemoryStore.playerSlingshotUpgrades =
          InMemoryStore.playerSlingshotUpgrades :+ PlayerSlingshotUpgradeRow(userId, 1, Instant.now().toString)
      }
    } else {
      PlayerPreparationTableJdbc.ensureSlingshotDefault(connection, userId, nowString())
    }

  private def upsertBird(
    connection: Connection,
    userId: String,
    birdType: String,
    level: Int,
    tier: Int
  ): Unit = {
    val updatedAt = nowString()
    if (TableConnection.isInMemory(connection)) {
      InMemoryStore.playerBirdUpgrades =
        InMemoryStore.playerBirdUpgrades.filterNot(row => row.userId == userId && row.birdType == birdType) :+
          PlayerBirdUpgradeRow(userId, birdType, level, tier, updatedAt)
    } else {
      PlayerPreparationTableJdbc.upsertBird(connection, userId, birdType, level, tier, updatedAt)
    }
  }

  private def upsertSlingshot(connection: Connection, userId: String, level: Int): Unit = {
    val updatedAt = nowString()
    if (TableConnection.isInMemory(connection)) {
      InMemoryStore.playerSlingshotUpgrades =
        InMemoryStore.playerSlingshotUpgrades.filterNot(_.userId == userId) :+
          PlayerSlingshotUpgradeRow(userId, level, updatedAt)
    } else {
      PlayerPreparationTableJdbc.upsertSlingshot(connection, userId, level, updatedAt)
    }
  }

  private def nowString(): String = Instant.now().toString
}
