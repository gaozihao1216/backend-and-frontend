package microservice.user.tables

/** 用户资料读模型的投影行（预留结构，当前 GetUserProfile 在 APIMessage 内直接聚合，未使用此类型）。
  *
  * 若未来将 profile 查询下沉到独立 table/service，可在此扩展 JDBC 实现。
  */
final case class UserProfileProjectionRow(
  userId: String,
  publishedLevelIds: List[String],
  recentCommentIds: List[String],
  favoriteCount: Int,
  ratingCount: Int
)
