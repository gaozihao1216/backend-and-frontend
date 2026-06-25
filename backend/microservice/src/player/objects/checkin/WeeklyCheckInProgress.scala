package microservice.player.objects.checkin

/** 玩家当周签到进度：已签格子集合与今日是否已签。 */
final case class WeeklyCheckInProgress(
  weekKey: String,
  signedSlots: Set[Int] = Set.empty,
  signedToday: Boolean = false
)
