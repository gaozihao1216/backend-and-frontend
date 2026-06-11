/** 每周签到表在存储层的行模型（与 PostgreSQL 表列一一对应）。
  *
  * 不直接作为 API 响应；经 RowMapper 转为 objects 包中的领域对象。
  */
package microservice.player.tables.weekly_check_in

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
