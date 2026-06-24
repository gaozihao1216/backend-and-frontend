/**
  *
   * 定义：PlayerWeeklyCheckInRow case class，与 DB 表列一一对应的存储层行模型。
 * 问题：API 对象不宜直接暴露 SQL 列布局，需 Row 作为持久化边界。
 * 作用：Table insert/find 的入参/出参；经 Mapper/Codec 与 objects 层转换。
 * 关联：同包 [[PlayerWeeklyCheckInTable]] 读写。
 */
package microservice.player.tables.weekly_check_in

final case class PlayerWeeklyCheckInRow(
  userId: String,
  weekKey: String,
  signedSlots: String,
  signedToday: Boolean,
  updatedAt: String
)

private[player] object PlayerWeeklyCheckInSlotsCodec {
  def encode(slots: Set[Int]): String =
    slots.toVector.sorted.mkString(",")

  def decode(raw: String): Set[Int] =
    if (raw.trim.isEmpty) Set.empty
    else raw.split(",").flatMap(value => scala.util.Try(value.trim.toInt).toOption).toSet
}
