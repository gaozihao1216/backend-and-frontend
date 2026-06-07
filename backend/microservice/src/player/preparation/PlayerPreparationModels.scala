package microservice.player.preparation

final case class BirdStatsView(
  attack: Int,
  impact: Int,
  speed: Int
)

final case class BirdUpgradeView(
  birdType: String,
  name: String,
  summary: String,
  previewImageUrl: String,
  level: Int,
  maxLevel: Int,
  tier: Int,
  maxTier: Int,
  stats: BirdStatsView,
  skillName: String,
  skillDescription: String,
  nextTierSkillPreview: Option[String],
  nextCostCoins: Int,
  nextCostFragments: Int,
  source: String,
  authorId: Option[String]
)

final case class SlingshotUpgradeView(
  level: Int,
  maxLevel: Int,
  nextCostCoins: Int
)

final case class PlayerPreparationResponse(
  birds: List[BirdUpgradeView],
  slingshot: SlingshotUpgradeView,
  walletCoins: Int,
  walletFragments: Int
)
