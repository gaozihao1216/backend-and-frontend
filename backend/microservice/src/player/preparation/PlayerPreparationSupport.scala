package microservice.player.preparation

import microservice.bird.tables.skill_config.BirdSkillConfigTable
import microservice.player.objects.{
  BirdStatsView,
  BirdUpgradeView,
  PlayerPreparationResponse,
  PlayerWallet,
  SlingshotUpgradeView
}
import microservice.player.tables.preparation.PlayerPreparationTable
import java.sql.Connection

/** 备战响应组装（纯读表 + 映射，供 APIMessage plan 调用）。 */
private[player] object PlayerPreparationSupport {
  def buildResponse(connection: Connection, userId: String, wallet: PlayerWallet): PlayerPreparationResponse = {
    val catalogEntries = PlayerPreparationCatalog.loadEntries(connection)
    PlayerPreparationTable.ensureBirdDefaults(connection, userId, catalogEntries.map(_.birdType))
    val birdLevels = PlayerPreparationTable.listBirdLevels(connection, userId)
    val birdTiers = PlayerPreparationTable.listBirdTiers(connection, userId)
    val slingshotLevel = PlayerPreparationTable.getSlingshotLevel(connection, userId)
    val skillConfigs = BirdSkillConfigTable.skillsJsonMap(connection)
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
