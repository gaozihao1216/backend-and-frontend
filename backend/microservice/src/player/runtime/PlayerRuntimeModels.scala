package microservice.player.runtime

final case class PlayerWallet(
  coins: Int = 0,
  gems: Int = 0,
  fragments: Int = 0
)

final case class CheckInSlotReward(
  coins: Int = 0,
  gems: Int = 0,
  fragments: Int = 0
)

final case class WeeklyCheckInProgress(
  weekKey: String,
  signedSlots: Set[Int] = Set.empty,
  signedToday: Boolean = false
)
