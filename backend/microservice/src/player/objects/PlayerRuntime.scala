package microservice.player.objects

/** 玩家运行时领域对象聚合。
  *
  * 定义：PlayerWallet、WeeklyCheckInProgress、CheckInSlotReward 等 case class。
  * 问题：钱包/签到/商店状态需与前端 objects/player 对齐。
  * 作用：Table Row 与 API JSON 的中间表示。
  * 关联：frontend/src/objects/player/；各 runtime Service。
  */
final case class PlayerWallet(
  coins: Int = 0,
  gems: Int = 0,
  fragments: Int = 0
)

/** 周签到单个格子的奖励配置（总监可通过 panel-workflows 注册）。 */
final case class CheckInSlotReward(
  coins: Int = 0,
  gems: Int = 0,
  fragments: Int = 0
)

/** 玩家当周签到进度：已签格子集合与今日是否已签。 */
final case class WeeklyCheckInProgress(
  weekKey: String,
  signedSlots: Set[Int] = Set.empty,
  signedToday: Boolean = false
)
