package microservice.player.preparation

/** 系统内置鸟备战静态配置。
  *
  * 定义：entries 定义默认 birdType、升级费用曲线、tier 技能占位。
  * 问题：无设计师鸟时准备页仍需可玩默认鸟种。
  * 作用：Vector 静态数据，不访问 DB。
  * 关联：[[PlayerPreparationCatalog.loadEntries]] 前缀合并。
  */
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

/** 系统内置鸟备战目录：三只默认鸟及其 tier 技能描述与预览图。 */
object BirdPreparationCatalog {
  /** 鸟阶位上限（1-3 对应三档技能描述）。 */
  val maxTier: Int = 3

  private val basicPreview =
    "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240' viewBox='0 0 240 240'%3E%3Ccircle cx='120' cy='120' r='88' fill='%23fbbf24'/%3E%3Ccircle cx='96' cy='104' r='10' fill='%23111827'/%3E%3Ccircle cx='144' cy='104' r='10' fill='%23111827'/%3E%3Cpath d='M92 148c12 18 44 18 56 0' stroke='%23111827' stroke-width='8' fill='none' stroke-linecap='round'/%3E%3Cpath d='M188 120c28-8 36-28 36-28s-18 4-36 16' fill='%23f97316'/%3E%3C/svg%3E"

  private val splitPreview =
    "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240' viewBox='0 0 240 240'%3E%3Ccircle cx='88' cy='118' r='52' fill='%2338bdf8'/%3E%3Ccircle cx='152' cy='118' r='52' fill='%2322d3ee'/%3E%3Ccircle cx='76' cy='108' r='8' fill='%23111827'/%3E%3Ccircle cx='164' cy='108' r='8' fill='%23111827'/%3E%3Cpath d='M120 56 L120 184' stroke='%23ffffff' stroke-width='6' stroke-dasharray='10 8'/%3E%3C/svg%3E"

  private val bombPreview =
    "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240' viewBox='0 0 240 240'%3E%3Ccircle cx='120' cy='126' r='72' fill='%23111827'/%3E%3Cpath d='M120 54c8-18 28-18 36 0-10 6-18 16-18 28' fill='%23ef4444'/%3E%3Ccircle cx='120' cy='126' r='48' fill='%234b5563'/%3E%3Cpath d='M84 170c12 24 60 24 72 0' stroke='%23f97316' stroke-width='10' fill='none'/%3E%3C/svg%3E"

  val entries: Vector[BirdCatalogEntry] = Vector(
    BirdCatalogEntry(
      birdType = "basic",
      name = "基础鸟",
      summary = "稳定直线冲击，适合新手关卡与常规拆塔。",
      previewImageUrl = basicPreview,
      baseStats = BirdBaseStats(attack = 100, impact = 80, speed = 60),
      skillName = "精准冲击",
      tierSkillDescriptions = Vector(
        "命中首个目标后造成标准冲击伤害。",
        "冲击波小幅扩散，可震荡相邻结构。",
        "命中后附带短距二次冲击，更容易触发连锁坍塌。"
      )
    ),
    BirdCatalogEntry(
      birdType = "split",
      name = "分裂鸟",
      summary = "飞行过程中分裂，适合覆盖多个薄弱点。",
      previewImageUrl = splitPreview,
      baseStats = BirdBaseStats(attack = 70, impact = 60, speed = 85),
      skillName = "分裂打击",
      tierSkillDescriptions = Vector(
        "飞行中段分裂为 2 个子体。",
        "分裂体数量 +1，子体速度小幅提升。",
        "分裂体附带穿透效果，可穿过薄层障碍。"
      )
    ),
    BirdCatalogEntry(
      birdType = "bomb",
      name = "爆炸鸟",
      summary = "接触即爆，擅长清理密集结构与玻璃区。",
      previewImageUrl = bombPreview,
      baseStats = BirdBaseStats(attack = 120, impact = 110, speed = 45),
      skillName = "爆破冲击",
      tierSkillDescriptions = Vector(
        "接触时造成小范围爆炸。",
        "爆炸半径扩大，附加持续灼烧伤害。",
        "爆炸会连锁引爆附近爆破点，适合清场。"
      )
    )
  )

  /** 按 birdType 在系统内置目录中查找。 */
  def find(birdType: String): Option[BirdCatalogEntry] =
    entries.find(_.birdType == birdType)

  /** 按等级计算实际属性（每级 +8 攻击/冲击，+5 速度）。 */
  def statsFor(level: Int, base: BirdBaseStats): BirdBaseStats = {
    val bonus = math.max(level - 1, 0)
    BirdBaseStats(
      attack = base.attack + bonus * 8,
      impact = base.impact + bonus * 8,
      speed = base.speed + bonus * 5
    )
  }

  /** 返回当前 tier 对应的技能描述文案。 */
  def skillDescription(entry: BirdCatalogEntry, tier: Int): String =
    entry.tierSkillDescriptions(math.min(math.max(tier, 1), entry.tierSkillDescriptions.length) - 1)

  /** 若未达 maxTier，返回下一阶技能预览文案。 */
  def nextTierSkillPreview(entry: BirdCatalogEntry, tier: Int): Option[String] =
    if (tier >= maxTier) None
    else Some(entry.tierSkillDescriptions(tier))
}
