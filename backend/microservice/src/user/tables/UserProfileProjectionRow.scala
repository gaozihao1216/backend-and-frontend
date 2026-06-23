package microservice.user.tables

/** 用户资料读模型轻量投影（仅 ID 与计数，不含完整领域对象）。 */
final case class UserProfileProjectionRow(
  userId: String,
  publishedLevelIds: List[String],
  recentCommentIds: List[String],
  favoriteCount: Int,
  ratingCount: Int
)
