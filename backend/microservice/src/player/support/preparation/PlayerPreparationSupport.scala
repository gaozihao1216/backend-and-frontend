package microservice.player.support.preparation

import microservice.player.objects.preparation.{
  BirdSkillConfigView,
  BirdStatsView,
  BirdUpgradeView,
  PlayerPreparationResponse,
  SlingshotUpgradeView
}
import microservice.player.objects.wallet.PlayerWallet
import microservice.player.tables.preparation.PlayerPreparationTable
import java.sql.Connection

/** 备战页响应组装支持（纯读表 + 映射）。
  *
  * API 层负责鉴权与跨模块读取；本对象只把钱包、鸟目录、技能配置和玩家升级表
  * 组合成前端需要的 PlayerPreparationResponse，避免 API plan 中出现大段映射代码。
  */
private[player] object PlayerPreparationSupport {
  /** 构建准备页完整响应，并补齐玩家尚未拥有记录的系统鸟默认等级。 */
  def buildResponse(
    connection: Connection,
    userId: String,
    wallet: PlayerWallet,
    catalogEntries: Vector[BirdCatalogEntry],
    skillConfigs: Map[String, BirdSkillConfigView]
  ): PlayerPreparationResponse = {
    PlayerPreparationTable.ensureBirdDefaults(connection, userId, catalogEntries.map(_.birdType))
    val birdLevels = PlayerPreparationTable.listBirdLevels(connection, userId)
    val birdTiers = PlayerPreparationTable.listBirdTiers(connection, userId)
    val slingshotLevel = PlayerPreparationTable.getSlingshotLevel(connection, userId)
    PlayerPreparationResponse(
      birds = catalogEntries.map { entry =>
        val level = birdLevels.getOrElse(entry.birdType, 1)
        val tier = birdTiers.getOrElse(entry.birdType, 1)
        val stats = BirdPreparationCatalog.statsFor(level, entry.baseStats)
        val skillConfig = skillConfigs.get(entry.birdType)
        BirdUpgradeView(
          birdType = entry.birdType,
          name = entry.name,
          summary = entry.summary,
          previewImageUrl = entry.previewImageUrl,
          level = level,
          maxLevel = PlayerPreparationTable.maxLevel,
          tier = tier,
          maxTier = PlayerPreparationTable.maxTier,
          stats = BirdStatsView(stats.attack, stats.impact, stats.speed),
          skillName = entry.skillName,
          skillDescription = BirdPreparationCatalog.skillDescription(entry, tier),
          nextTierSkillPreview = BirdPreparationCatalog.nextTierSkillPreview(entry, tier),
          nextCostCoins = if (level >= PlayerPreparationTable.maxLevel) 0 else PlayerPreparationTable.upgradeCost(level),
          nextCostFragments = if (tier >= PlayerPreparationTable.maxTier) 0 else PlayerPreparationTable.ascendCost(tier),
          source = entry.source,
          authorId = entry.authorId,
          skills = skillConfig.map(_.skills),
          modelImageUrl = skillConfig.flatMap(_.modelImageUrl).orElse(Some(entry.previewImageUrl))
        )
      }.toList,
      slingshot = SlingshotUpgradeView(
        level = slingshotLevel,
        maxLevel = PlayerPreparationTable.maxLevel,
        nextCostCoins =
          if (slingshotLevel >= PlayerPreparationTable.maxLevel) 0
          else PlayerPreparationTable.upgradeCost(slingshotLevel)
      ),
      walletCoins = wallet.coins,
      walletFragments = wallet.fragments
    )
  }
}
