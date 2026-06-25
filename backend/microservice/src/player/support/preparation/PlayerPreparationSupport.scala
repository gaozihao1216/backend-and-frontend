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

/** 备战页响应组装支持（纯读表 + 映射）。 */
private[player] object PlayerPreparationSupport {
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
