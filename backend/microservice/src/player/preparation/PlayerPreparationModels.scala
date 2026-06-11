package microservice.player.preparation

import io.circe.Json

/** 鸟的三维战斗属性视图（攻击、冲击、速度）。 */
final case class BirdStatsView(
  attack: Int,
  impact: Int,
  speed: Int
)

/** 单只鸟的备战升级视图：等级、阶位、属性、技能与下次升级花费。 */
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
  authorId: Option[String],
  skills: Option[Json] = None,
  modelImageUrl: Option[String] = None
)

/** 弹弓升级视图：当前等级与下次升级金币花费。 */
final case class SlingshotUpgradeView(
  level: Int,
  maxLevel: Int,
  nextCostCoins: Int
)

/** GET /player/preparation 的完整响应：全部鸟、弹弓与钱包余额摘要。 */
final case class PlayerPreparationResponse(
  birds: List[BirdUpgradeView],
  slingshot: SlingshotUpgradeView,
  walletCoins: Int,
  walletFragments: Int
)
