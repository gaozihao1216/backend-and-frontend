package microservice.player.tables

final case class PlayerWeeklyCheckInRow(
  userId: String,
  weekKey: String,
  signedSlots: String,
  signedToday: Boolean,
  updatedAt: String
)

object PlayerWeeklyCheckInSlotsCodec {
  def encode(slots: Set[Int]): String =
    slots.toVector.sorted.mkString(",")

  def decode(raw: String): Set[Int] =
    if (raw.trim.isEmpty) Set.empty
    else raw.split(",").flatMap(value => scala.util.Try(value.trim.toInt).toOption).toSet
}
