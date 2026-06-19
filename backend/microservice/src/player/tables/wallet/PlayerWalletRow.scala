/**
  *
   * 定义：PlayerWalletRow case class，与 DB 表列一一对应的存储层行模型。
 * 问题：API 对象不宜直接暴露 SQL 列布局，需 Row 作为持久化边界。
 * 作用：Table insert/find 的入参/出参；经 Mapper/Codec 与 objects 层转换。
 * 关联：同包 [[PlayerWalletTable]] 读写。
 */
package microservice.player.tables.wallet

final case class PlayerWalletRow(
  userId: String,
  coins: Int,
  gems: Int,
  fragments: Int,
  updatedAt: String
)
