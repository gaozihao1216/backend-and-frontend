package microservice.bird.support.catalog

import microservice.bird.objects.catalog.SystemBirdCatalogEntry

/** 系统内置鸟静态 catalog（bird 模块内单一数据源）。 */
object SystemBirdCatalogSupport {
  val maxTier: Int = 3

  private val basicPreview =
    "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240' viewBox='0 0 240 240'%3E%3Ccircle cx='120' cy='120' r='88' fill='%23fbbf24'/%3E%3Ccircle cx='96' cy='104' r='10' fill='%23111827'/%3E%3Ccircle cx='144' cy='104' r='10' fill='%23111827'/%3E%3Cpath d='M92 148c12 18 44 18 56 0' stroke='%23111827' stroke-width='8' fill='none' stroke-linecap='round'/%3E%3Cpath d='M188 120c28-8 36-28 36-28s-18 4-36 16' fill='%23f97316'/%3E%3C/svg%3E"

  private val splitPreview =
    "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240' viewBox='0 0 240 240'%3E%3Ccircle cx='88' cy='118' r='52' fill='%2338bdf8'/%3E%3Ccircle cx='152' cy='118' r='52' fill='%2322d3ee'/%3E%3Ccircle cx='76' cy='108' r='8' fill='%23111827'/%3E%3Ccircle cx='164' cy='108' r='8' fill='%23111827'/%3E%3Cpath d='M120 56 L120 184' stroke='%23ffffff' stroke-width='6' stroke-dasharray='10 8'/%3E%3C/svg%3E"

  private val bombPreview =
    "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240' viewBox='0 0 240 240'%3E%3Ccircle cx='120' cy='126' r='72' fill='%23111827'/%3E%3Cpath d='M120 54c8-18 28-18 36 0-10 6-18 16-18 28' fill='%23ef4444'/%3E%3Ccircle cx='120' cy='126' r='48' fill='%234b5563'/%3E%3Cpath d='M84 170c12 24 60 24 72 0' stroke='%23f97316' stroke-width='10' fill='none'/%3E%3C/svg%3E"

  val entries: Vector[SystemBirdCatalogEntry] = Vector(
    SystemBirdCatalogEntry(
      birdType = "basic",
      name = "基础鸟",
      summary = "稳定直线冲击，适合新手关卡与常规拆塔。",
      previewImageUrl = basicPreview,
      attack = 100,
      impact = 80,
      speed = 60,
      skillName = "精准冲击",
      tierSkillDescriptions = Vector(
        "命中首个目标后造成标准冲击伤害。",
        "冲击波小幅扩散，可震荡相邻结构。",
        "命中后附带短距二次冲击，更容易触发连锁坍塌。"
      )
    ),
    SystemBirdCatalogEntry(
      birdType = "split",
      name = "分裂鸟",
      summary = "飞行过程中分裂，适合覆盖多个薄弱点。",
      previewImageUrl = splitPreview,
      attack = 70,
      impact = 60,
      speed = 85,
      skillName = "分裂打击",
      tierSkillDescriptions = Vector(
        "飞行中段分裂为 2 个子体。",
        "分裂体数量 +1，子体速度小幅提升。",
        "分裂体附带穿透效果，可穿过薄层障碍。"
      )
    ),
    SystemBirdCatalogEntry(
      birdType = "bomb",
      name = "爆炸鸟",
      summary = "接触即爆，擅长清理密集结构与玻璃区。",
      previewImageUrl = bombPreview,
      attack = 120,
      impact = 110,
      speed = 45,
      skillName = "爆破冲击",
      tierSkillDescriptions = Vector(
        "接触时造成小范围爆炸。",
        "爆炸半径扩大，附加持续灼烧伤害。",
        "爆炸会连锁引爆附近爆破点，适合清场。"
      )
    )
  )

  val birdTypes: Vector[String] = entries.map(_.birdType)
}
