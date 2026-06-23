package microservice.player.preparation

final case class BirdBaseStats(attack: Int, impact: Int, speed: Int)

/** 系统内置或设计师发布鸟在备战目录中的条目。 */
final case class BirdCatalogEntry(
  birdType: String,
  name: String,
  summary: String,
  previewImageUrl: String,
  baseStats: BirdBaseStats,
  skillName: String,
  tierSkillDescriptions: Vector[String],
  source: String = "system",
  authorId: Option[String] = None
)

/** 玩家备战页鸟属性计算与阶位常量（player 模块内游戏逻辑）。 */
object BirdPreparationCatalog {
  val maxTier: Int = 3

  def statsFor(level: Int, base: BirdBaseStats): BirdBaseStats = {
    val bonus = math.max(level - 1, 0)
    BirdBaseStats(
      attack = base.attack + bonus * 8,
      impact = base.impact + bonus * 8,
      speed = base.speed + bonus * 5
    )
  }

  def skillDescription(entry: BirdCatalogEntry, tier: Int): String =
    entry.tierSkillDescriptions(math.min(math.max(tier, 1), entry.tierSkillDescriptions.length) - 1)

  def nextTierSkillPreview(entry: BirdCatalogEntry, tier: Int): Option[String] =
    if (tier >= maxTier) None
    else Some(entry.tierSkillDescriptions(tier))
}
