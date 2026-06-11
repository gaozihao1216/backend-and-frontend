package microservice.player.runtime

/** 玩家钱包运行时模型：金币、宝石、碎片三种货币。 */
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
